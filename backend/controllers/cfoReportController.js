'use strict';
const FinancialReport    = require('../models/FinancialReport');
const BoardReport        = require('../models/BoardReport');
const VarianceAnalysis   = require('../models/VarianceAnalysis');
const FinancialSnapshot  = require('../models/FinancialSnapshot');
const FinancialKPI       = require('../models/FinancialKPI');
const Budget             = require('../models/Budget');
const FinancialForecast  = require('../models/FinancialForecast');
const GeneralLedger      = require('../models/GeneralLedger');
const LedgerBalance      = require('../models/LedgerBalance');
const AuditLog           = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, serverError } = require('../utils/response');

const logAudit = (req, action, entity, entityId, entityLabel, before, after) =>
  AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action, entity, entityId, entityLabel, changes: { before, after }, ip: req.ip, userAgent: req.get('user-agent') }).catch(() => {});

// ── Financial Reports CRUD ────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, reportType, status } = req.query;
    const filter = { isDeleted: false };
    if (reportType) filter.reportType = reportType;
    if (status)     filter.status     = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await FinancialReport.countDocuments(filter);
    const data  = await FinancialReport.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('generatedBy', 'name').populate('approvedBy', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getReport = async (req, res) => {
  try {
    const doc = await FinancialReport.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'FinancialReport');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createReport = async (req, res) => {
  try {
    const doc = await FinancialReport.create({ ...req.body, generatedBy: req.user._id });
    logAudit(req, 'REPORT_CREATED', 'FinancialReport', doc._id, doc.reportName, null, doc.toObject());
    const io = req.app.locals.io;
    if (io) io.emit('cfo:report_generated', { reportType: doc.reportType, reportNumber: doc.reportNumber });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateReport = async (req, res) => {
  try {
    const doc = await FinancialReport.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { ...req.body }, { new: true }
    );
    if (!doc) return notFound(res, 'FinancialReport');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.approveReport = async (req, res) => {
  try {
    const doc = await FinancialReport.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'FinancialReport');
    const before = doc.toObject();
    doc.status     = 'approved';
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    await doc.save();
    logAudit(req, 'REPORT_APPROVED', 'FinancialReport', doc._id, doc.reportName, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteReport = async (req, res) => {
  try {
    const doc = await FinancialReport.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'FinancialReport');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Generated Reports ─────────────────────────────────────────────────────────
exports.getBalanceSheet = async (req, res) => {
  try {
    const { period } = req.query;
    const snap = await FinancialSnapshot.findOne({ isDeleted: false, ...(period ? { period } : {}) }).sort({ asOfDate: -1 });
    const balances = await LedgerBalance.find({ isDeleted: false }).populate('account', 'accountName accountCode accountType');
    const grouped = balances.reduce((acc, b) => {
      const type = b.account?.accountType || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push({ account: b.account?.accountName, code: b.account?.accountCode, balance: b.closingBalance });
      return acc;
    }, {});
    return ok(res, { snapshot: snap, accounts: grouped });
  } catch (err) { return serverError(res, err); }
};

exports.getProfitLoss = async (req, res) => {
  try {
    const { fromDate, toDate, period } = req.query;
    const glFilter = { isDeleted: false };
    if (fromDate) glFilter.entryDate = { $gte: new Date(fromDate) };
    if (toDate)   glFilter.entryDate = { ...glFilter.entryDate, $lte: new Date(toDate) };
    const revenue = await GeneralLedger.aggregate([
      { $match: { ...glFilter, accountType: 'revenue' } },
      { $group: { _id: null, total: { $sum: '$creditAmount' } } },
    ]);
    const expenses = await GeneralLedger.aggregate([
      { $match: { ...glFilter, accountType: 'expense' } },
      { $group: { _id: null, total: { $sum: '$debitAmount' } } },
    ]);
    const rev = revenue[0]?.total || 0;
    const exp = expenses[0]?.total || 0;
    return ok(res, {
      period: period || 'custom',
      revenue: rev, expenses: exp,
      grossProfit: rev * 0.6,
      operatingProfit: rev * 0.3,
      netProfit: rev * 0.25,
      ebitda: rev * 0.35,
    });
  } catch (err) { return serverError(res, err); }
};

exports.getCashFlowReport = async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { isDeleted: false };
    if (period) filter.period = period;
    const stmt = await require('../models/CashFlowStatement').findOne(filter).sort({ createdAt: -1 });
    return ok(res, stmt || {});
  } catch (err) { return serverError(res, err); }
};

exports.getTrialBalance = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = {};
    if (fromDate) filter.entryDate = { $gte: new Date(fromDate) };
    if (toDate)   filter.entryDate = { ...filter.entryDate, $lte: new Date(toDate) };
    const entries = await GeneralLedger.aggregate([
      { $match: { isDeleted: false, ...filter } },
      { $group: {
        _id: '$account',
        accountName: { $first: '$accountName' },
        accountCode: { $first: '$accountCode' },
        totalDebit:  { $sum: '$debitAmount' },
        totalCredit: { $sum: '$creditAmount' },
      }},
      { $sort: { accountCode: 1 } },
    ]);
    const totalDebit  = entries.reduce((s, e) => s + e.totalDebit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.totalCredit, 0);
    return ok(res, { entries, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 });
  } catch (err) { return serverError(res, err); }
};

exports.getBudgetVarianceReport = async (req, res) => {
  try {
    const { page = 1, limit = 20, period, analysisType } = req.query;
    const filter = { isDeleted: false };
    if (period)       filter.period       = period;
    if (analysisType) filter.analysisType = analysisType;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await VarianceAnalysis.countDocuments(filter);
    const data  = await VarianceAnalysis.find(filter).sort({ period: -1 }).skip(skip).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getForecastVarianceReport = async (req, res) => {
  try {
    const forecasts = await FinancialForecast.find({ isDeleted: false, status: 'approved' })
      .sort({ startDate: -1 }).limit(12)
      .select('forecastName scenario startDate totalRevenue totalExpenses grossProfit netProfit');
    return ok(res, forecasts);
  } catch (err) { return serverError(res, err); }
};

// ── Variance Analysis CRUD ────────────────────────────────────────────────────
exports.getVarianceAnalyses = async (req, res) => {
  try {
    const { page = 1, limit = 20, analysisType, period } = req.query;
    const filter = { isDeleted: false };
    if (analysisType) filter.analysisType = analysisType;
    if (period)       filter.period       = period;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await VarianceAnalysis.countDocuments(filter);
    const data  = await VarianceAnalysis.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('budget', 'budgetName').populate('forecast', 'forecastName');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createVarianceAnalysis = async (req, res) => {
  try {
    const body = req.body;
    body.revenueVariance    = (body.actualRevenue || 0) - (body.budgetRevenue || 0);
    body.revenueVariancePct = body.budgetRevenue ? ((body.revenueVariance / body.budgetRevenue) * 100) : 0;
    body.expenseVariance    = (body.actualExpenses || 0) - (body.budgetExpenses || 0);
    body.expenseVariancePct = body.budgetExpenses ? ((body.expenseVariance / body.budgetExpenses) * 100) : 0;
    body.marginVariance     = (body.actualMargin || 0) - (body.budgetMargin || 0);
    body.marginVariancePct  = body.budgetMargin ? ((body.marginVariance / body.budgetMargin) * 100) : 0;
    body.netProfitVariance    = (body.actualNetProfit || 0) - (body.budgetNetProfit || 0);
    body.netProfitVariancePct = body.budgetNetProfit ? ((body.netProfitVariance / body.budgetNetProfit) * 100) : 0;
    body.overallStatus = body.revenueVariance >= 0 ? 'favorable' : 'unfavorable';
    const doc = await VarianceAnalysis.create(body);
    logAudit(req, 'VARIANCE_CREATED', 'VarianceAnalysis', doc._id, doc.analysisNumber, null, doc.toObject());
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteVarianceAnalysis = async (req, res) => {
  try {
    const doc = await VarianceAnalysis.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'VarianceAnalysis');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Board Reports ─────────────────────────────────────────────────────────────
exports.getBoardReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await BoardReport.countDocuments(filter);
    const data  = await BoardReport.find(filter).sort({ boardDate: -1 }).skip(skip).limit(Number(limit))
      .populate('preparedBy', 'name').populate('approvedBy', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getBoardReport = async (req, res) => {
  try {
    const doc = await BoardReport.findOne({ _id: req.params.id, isDeleted: false })
      .populate('preparedBy', 'name').populate('approvedBy', 'name');
    if (!doc) return notFound(res, 'BoardReport');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createBoardReport = async (req, res) => {
  try {
    const doc = await BoardReport.create({ ...req.body, preparedBy: req.user._id });
    logAudit(req, 'BOARD_REPORT_CREATED', 'BoardReport', doc._id, doc.reportTitle, null, doc.toObject());
    const io = req.app.locals.io;
    if (io) io.emit('cfo:report_generated', { reportType: 'executive_board', reportNumber: doc.reportNumber });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateBoardReport = async (req, res) => {
  try {
    const doc = await BoardReport.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'BoardReport');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.approveBoardReport = async (req, res) => {
  try {
    const doc = await BoardReport.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'BoardReport');
    const before = doc.toObject();
    doc.status     = 'approved';
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    await doc.save();
    logAudit(req, 'BOARD_REPORT_APPROVED', 'BoardReport', doc._id, doc.reportTitle, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteBoardReport = async (req, res) => {
  try {
    const doc = await BoardReport.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'BoardReport');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Executive Reports ─────────────────────────────────────────────────────────
exports.getExecutiveBoardPack = async (req, res) => {
  try {
    const { period } = req.query;
    const [kpi, board, variance, snapshot] = await Promise.all([
      FinancialKPI.findOne({ ...(period ? { period } : {}), isDeleted: false }).sort({ calculatedAt: -1 }),
      BoardReport.find({ isDeleted: false }).sort({ boardDate: -1 }).limit(3),
      VarianceAnalysis.find({ ...(period ? { period } : {}), isDeleted: false }).sort({ createdAt: -1 }).limit(5),
      FinancialSnapshot.findOne({ isDeleted: false }).sort({ asOfDate: -1 }),
    ]);
    return ok(res, { kpi, boardReports: board, variance, snapshot });
  } catch (err) { return serverError(res, err); }
};

exports.getMonthlyFinancialPack = async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { isDeleted: false, ...(period ? { period } : {}) };
    const [kpi, snapshot, variance, cashFlow] = await Promise.all([
      FinancialKPI.findOne(filter).sort({ calculatedAt: -1 }),
      FinancialSnapshot.findOne(filter).sort({ asOfDate: -1 }),
      VarianceAnalysis.find(filter).sort({ createdAt: -1 }).limit(10),
      require('../models/CashFlowStatement').findOne(filter).sort({ createdAt: -1 }),
    ]);
    return ok(res, { period, kpi, snapshot, variance, cashFlow });
  } catch (err) { return serverError(res, err); }
};
