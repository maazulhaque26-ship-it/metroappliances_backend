'use strict';
const CashFlowStatement = require('../models/CashFlowStatement');
const BankAccount       = require('../models/BankAccount');
const BankTransaction   = require('../models/BankTransaction');
const AuditLog          = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, serverError } = require('../utils/response');

const logAudit = (req, action, entity, entityId, entityLabel, before, after) =>
  AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action, entity, entityId, entityLabel, changes: { before, after }, ip: req.ip, userAgent: req.get('user-agent') }).catch(() => {});

// ── Cash Flow Statements ──────────────────────────────────────────────────────
exports.getStatements = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, period } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (period) filter.period = period;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await CashFlowStatement.countDocuments(filter);
    const data  = await CashFlowStatement.find(filter).sort({ period: -1 }).skip(skip).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getStatement = async (req, res) => {
  try {
    const doc = await CashFlowStatement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'CashFlowStatement');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createStatement = async (req, res) => {
  try {
    const body = req.body;
    // Compute derived fields
    body.operatingActivities = (body.netIncome || 0) + (body.depreciation || 0) + (body.amortization || 0)
      + (body.receivablesChange || 0) + (body.inventoryChange || 0) + (body.payablesChange || 0) + (body.otherWorkingCapital || 0);
    body.investingActivities = (body.assetSales || 0) - (body.capex || 0) - (body.investments || 0);
    body.financingActivities = (body.debtBorrowed || 0) - (body.debtRepaid || 0) + (body.equityRaised || 0) - (body.dividendsPaid || 0);
    body.netCashFlow         = body.operatingActivities + body.investingActivities + body.financingActivities;
    body.closingCash         = (body.openingCash || 0) + body.netCashFlow;
    body.freeCashFlow        = body.operatingActivities - (body.capex || 0);

    const doc = await CashFlowStatement.create(body);
    logAudit(req, 'CASHFLOW_CREATED', 'CashFlowStatement', doc._id, doc.statementNumber, null, doc.toObject());
    const io = req.app.locals.io;
    if (io) io.emit('cfo:cashflow_updated', { period: doc.period, netCashFlow: doc.netCashFlow, closingCash: doc.closingCash });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateStatement = async (req, res) => {
  try {
    const doc = await CashFlowStatement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'CashFlowStatement');
    if (doc.status === 'final') return res.status(400).json({ success: false, message: 'Final statements cannot be modified' });
    const before = doc.toObject();
    Object.assign(doc, req.body);
    doc.operatingActivities = (doc.netIncome || 0) + (doc.depreciation || 0) + (doc.amortization || 0)
      + (doc.receivablesChange || 0) + (doc.inventoryChange || 0) + (doc.payablesChange || 0) + (doc.otherWorkingCapital || 0);
    doc.investingActivities = (doc.assetSales || 0) - (doc.capex || 0) - (doc.investments || 0);
    doc.financingActivities = (doc.debtBorrowed || 0) - (doc.debtRepaid || 0) + (doc.equityRaised || 0) - (doc.dividendsPaid || 0);
    doc.netCashFlow         = doc.operatingActivities + doc.investingActivities + doc.financingActivities;
    doc.closingCash         = (doc.openingCash || 0) + doc.netCashFlow;
    doc.freeCashFlow        = doc.operatingActivities - (doc.capex || 0);
    await doc.save();
    logAudit(req, 'CASHFLOW_UPDATED', 'CashFlowStatement', doc._id, doc.statementNumber, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.finalizeStatement = async (req, res) => {
  try {
    const doc = await CashFlowStatement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'CashFlowStatement');
    doc.status = 'final';
    await doc.save();
    logAudit(req, 'CASHFLOW_FINALIZED', 'CashFlowStatement', doc._id, doc.statementNumber, null, { status: 'final' });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteStatement = async (req, res) => {
  try {
    const doc = await CashFlowStatement.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'CashFlowStatement');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Cash Position (live from BankAccount) ────────────────────────────────────
exports.getCashPosition = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ isActive: true, isDeleted: false })
      .select('accountNumber accountName bankName currency currentBalance accountType');
    const totalCash = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
    const byCurrency = accounts.reduce((acc, a) => {
      acc[a.currency] = (acc[a.currency] || 0) + a.currentBalance;
      return acc;
    }, {});
    return ok(res, { accounts, totalCash, byCurrency });
  } catch (err) { return serverError(res, err); }
};

// ── Liquidity Position ────────────────────────────────────────────────────────
exports.getLiquidityPosition = async (req, res) => {
  try {
    const [cashPos, recentStatements] = await Promise.all([
      BankAccount.aggregate([
        { $match: { isActive: true, isDeleted: false } },
        { $group: { _id: '$currency', total: { $sum: '$currentBalance' } } },
      ]),
      CashFlowStatement.find({ isDeleted: false }).sort({ period: -1 }).limit(6)
        .select('period netCashFlow closingCash freeCashFlow operatingActivities'),
    ]);
    return ok(res, { cashPosition: cashPos, trend: recentStatements.reverse() });
  } catch (err) { return serverError(res, err); }
};

// ── Free Cash Flow ────────────────────────────────────────────────────────────
exports.getFreeCashFlow = async (req, res) => {
  try {
    const statements = await CashFlowStatement.find({ isDeleted: false }).sort({ period: -1 }).limit(12)
      .select('period operatingActivities capex freeCashFlow netCashFlow');
    return ok(res, statements.reverse());
  } catch (err) { return serverError(res, err); }
};
