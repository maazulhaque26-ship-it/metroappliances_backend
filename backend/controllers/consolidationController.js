'use strict';
const ConsolidationGroup       = require('../models/ConsolidationGroup');
const ConsolidationCompany     = require('../models/ConsolidationCompany');
const InterCompanyTransaction  = require('../models/InterCompanyTransaction');
const EliminationEntry         = require('../models/EliminationEntry');
const FinancialSnapshot        = require('../models/FinancialSnapshot');
const AuditLog                 = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, serverError } = require('../utils/response');

const logAudit = (req, action, entity, entityId, entityLabel, before, after) =>
  AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action, entity, entityId, entityLabel, changes: { before, after }, ip: req.ip, userAgent: req.get('user-agent') }).catch(() => {});

// ── Consolidation Groups ──────────────────────────────────────────────────────
exports.getGroups = async (req, res) => {
  try {
    const docs = await ConsolidationGroup.find({ isDeleted: false }).sort({ groupName: 1 });
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createGroup = async (req, res) => {
  try {
    const doc = await ConsolidationGroup.create(req.body);
    logAudit(req, 'CONSOL_GROUP_CREATED', 'ConsolidationGroup', doc._id, doc.groupName, null, doc.toObject());
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateGroup = async (req, res) => {
  try {
    const doc = await ConsolidationGroup.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'ConsolidationGroup');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteGroup = async (req, res) => {
  try {
    const doc = await ConsolidationGroup.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'ConsolidationGroup');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Consolidation Companies ───────────────────────────────────────────────────
exports.getCompanies = async (req, res) => {
  try {
    const { group } = req.query;
    const filter = { isDeleted: false };
    if (group) filter.group = group;
    const docs = await ConsolidationCompany.find(filter).sort({ companyName: 1 })
      .populate('group', 'groupName groupCode');
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createCompany = async (req, res) => {
  try {
    const doc = await ConsolidationCompany.create(req.body);
    logAudit(req, 'CONSOL_COMPANY_CREATED', 'ConsolidationCompany', doc._id, doc.companyName, null, doc.toObject());
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateCompany = async (req, res) => {
  try {
    const doc = await ConsolidationCompany.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'ConsolidationCompany');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteCompany = async (req, res) => {
  try {
    const doc = await ConsolidationCompany.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'ConsolidationCompany');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Inter-Company Transactions ────────────────────────────────────────────────
exports.getICTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, fromCompany, toCompany } = req.query;
    const filter = { isDeleted: false };
    if (status)      filter.status      = status;
    if (fromCompany) filter.fromCompany = fromCompany;
    if (toCompany)   filter.toCompany   = toCompany;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await InterCompanyTransaction.countDocuments(filter);
    const data  = await InterCompanyTransaction.find(filter)
      .sort({ transactionDate: -1 }).skip(skip).limit(Number(limit))
      .populate('fromCompany', 'companyName companyCode')
      .populate('toCompany',   'companyName companyCode');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createICTransaction = async (req, res) => {
  try {
    const doc = await InterCompanyTransaction.create(req.body);
    logAudit(req, 'ICT_CREATED', 'InterCompanyTransaction', doc._id, doc.txNumber, null, doc.toObject());
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateICTransaction = async (req, res) => {
  try {
    const doc = await InterCompanyTransaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'InterCompanyTransaction');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteICTransaction = async (req, res) => {
  try {
    const doc = await InterCompanyTransaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'InterCompanyTransaction');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Elimination Entries ───────────────────────────────────────────────────────
exports.getEliminations = async (req, res) => {
  try {
    const { page = 1, limit = 20, period, consolidationGroup } = req.query;
    const filter = { isDeleted: false };
    if (period)             filter.period             = period;
    if (consolidationGroup) filter.consolidationGroup = consolidationGroup;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await EliminationEntry.countDocuments(filter);
    const data  = await EliminationEntry.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('consolidationGroup', 'groupName').populate('interCompanyTx', 'txNumber amount');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createElimination = async (req, res) => {
  try {
    const doc = await EliminationEntry.create(req.body);
    logAudit(req, 'ELIMINATION_CREATED', 'EliminationEntry', doc._id, doc.eliminationNumber, null, doc.toObject());
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteElimination = async (req, res) => {
  try {
    const doc = await EliminationEntry.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'EliminationEntry');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Consolidated Financials ───────────────────────────────────────────────────
exports.getConsolidatedPnL = async (req, res) => {
  try {
    const { group, period } = req.query;
    const snapFilter = { isDeleted: false };
    if (period) snapFilter.period = period;
    const snapshots = await FinancialSnapshot.find(snapFilter).sort({ asOfDate: -1 }).limit(12);
    const consolidated = snapshots.reduce((acc, s) => ({
      revenue:    (acc.revenue    || 0) + s.revenue,
      grossProfit:(acc.grossProfit|| 0) + s.grossProfit,
      netProfit:  (acc.netProfit  || 0) + s.netProfit,
      ebitda:     (acc.ebitda     || 0) + s.ebitda,
    }), {});
    return ok(res, { consolidated, snapshots, group, period });
  } catch (err) { return serverError(res, err); }
};

exports.getConsolidatedBalanceSheet = async (req, res) => {
  try {
    const { period } = req.query;
    const snapFilter = { isDeleted: false };
    if (period) snapFilter.period = period;
    const snapshots = await FinancialSnapshot.find(snapFilter).sort({ asOfDate: -1 }).limit(1);
    const snap = snapshots[0] || {};
    return ok(res, {
      period,
      totalAssets:      snap.totalAssets      || 0,
      totalLiabilities: snap.totalLiabilities || 0,
      totalEquity:      snap.totalEquity      || 0,
      workingCapital:   snap.workingCapital    || 0,
      cashBalance:      snap.cashBalance       || 0,
      bankBalance:      snap.bankBalance       || 0,
    });
  } catch (err) { return serverError(res, err); }
};

// ── Financial Snapshots ───────────────────────────────────────────────────────
exports.getSnapshots = async (req, res) => {
  try {
    const { page = 1, limit = 20, snapshotType } = req.query;
    const filter = { isDeleted: false };
    if (snapshotType) filter.snapshotType = snapshotType;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await FinancialSnapshot.countDocuments(filter);
    const data  = await FinancialSnapshot.find(filter).sort({ asOfDate: -1 }).skip(skip).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createSnapshot = async (req, res) => {
  try {
    const doc = await FinancialSnapshot.create({ ...req.body, generatedBy: req.user._id });
    logAudit(req, 'SNAPSHOT_CREATED', 'FinancialSnapshot', doc._id, doc.snapshotNumber, null, doc.toObject());
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};
