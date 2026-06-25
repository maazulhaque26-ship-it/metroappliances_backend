'use strict';
const ProfitabilityAnalysis = require('../models/ProfitabilityAnalysis');
const AuditLog              = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, serverError } = require('../utils/response');

const logAudit = (req, action, entity, entityId, entityLabel, before, after) =>
  AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action, entity, entityId, entityLabel, changes: { before, after }, ip: req.ip, userAgent: req.get('user-agent') }).catch(() => {});

// ── Profitability Analyses ────────────────────────────────────────────────────
exports.getAnalyses = async (req, res) => {
  try {
    const { page = 1, limit = 20, analysisType, period, status } = req.query;
    const filter = { isDeleted: false };
    if (analysisType) filter.analysisType = analysisType;
    if (period)       filter.period       = period;
    if (status)       filter.status       = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ProfitabilityAnalysis.countDocuments(filter);
    const data  = await ProfitabilityAnalysis.find(filter)
      .sort({ netProfit: -1, period: -1 }).skip(skip).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getAnalysis = async (req, res) => {
  try {
    const doc = await ProfitabilityAnalysis.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'ProfitabilityAnalysis');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createAnalysis = async (req, res) => {
  try {
    const body = req.body;
    body.grossProfit        = (body.revenue || 0) - (body.cogs || 0);
    body.grossMargin        = body.revenue ? ((body.grossProfit / body.revenue) * 100) : 0;
    body.totalExpenses      = (body.directExpenses || 0) + (body.allocatedOverhead || 0);
    body.netProfit          = body.grossProfit - body.totalExpenses;
    body.netMargin          = body.revenue ? ((body.netProfit / body.revenue) * 100) : 0;
    body.contribution       = body.grossProfit - (body.directExpenses || 0);
    body.contributionMargin = body.revenue ? ((body.contribution / body.revenue) * 100) : 0;

    const doc = await ProfitabilityAnalysis.create(body);
    logAudit(req, 'PROFITABILITY_CREATED', 'ProfitabilityAnalysis', doc._id, `${doc.analysisType}/${doc.entityName}`, null, doc.toObject());
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateAnalysis = async (req, res) => {
  try {
    const doc = await ProfitabilityAnalysis.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'ProfitabilityAnalysis');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    doc.grossProfit        = (doc.revenue || 0) - (doc.cogs || 0);
    doc.grossMargin        = doc.revenue ? ((doc.grossProfit / doc.revenue) * 100) : 0;
    doc.totalExpenses      = (doc.directExpenses || 0) + (doc.allocatedOverhead || 0);
    doc.netProfit          = doc.grossProfit - doc.totalExpenses;
    doc.netMargin          = doc.revenue ? ((doc.netProfit / doc.revenue) * 100) : 0;
    doc.contribution       = doc.grossProfit - (doc.directExpenses || 0);
    doc.contributionMargin = doc.revenue ? ((doc.contribution / doc.revenue) * 100) : 0;
    await doc.save();
    logAudit(req, 'PROFITABILITY_UPDATED', 'ProfitabilityAnalysis', doc._id, `${doc.analysisType}/${doc.entityName}`, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteAnalysis = async (req, res) => {
  try {
    const doc = await ProfitabilityAnalysis.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'ProfitabilityAnalysis');
    logAudit(req, 'PROFITABILITY_DELETED', 'ProfitabilityAnalysis', doc._id, `${doc.analysisType}/${doc.entityName}`, doc.toObject(), null);
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Typed Profitability Queries ───────────────────────────────────────────────
const getByType = (type) => async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { analysisType: type, isDeleted: false };
    if (period) filter.period = period;
    const data = await ProfitabilityAnalysis.find(filter)
      .sort({ netProfit: -1 }).limit(20)
      .select('entityName entityId period revenue grossProfit netProfit grossMargin netMargin contribution analysisType');
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.getProductProfitability   = getByType('product');
exports.getCustomerProfitability  = getByType('customer');
exports.getDealerProfitability    = getByType('dealer');
exports.getFactoryProfitability   = getByType('factory');
exports.getWarehouseProfitability = getByType('warehouse');
exports.getServiceProfitability   = getByType('service');

// ── Profitability Summary ─────────────────────────────────────────────────────
exports.getProfitabilitySummary = async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { isDeleted: false };
    if (period) filter.period = period;
    const summary = await ProfitabilityAnalysis.aggregate([
      { $match: filter },
      { $group: {
        _id: '$analysisType',
        totalRevenue:    { $sum: '$revenue' },
        totalGrossProfit:{ $sum: '$grossProfit' },
        totalNetProfit:  { $sum: '$netProfit' },
        count:           { $sum: 1 },
        avgNetMargin:    { $avg: '$netMargin' },
      }},
      { $sort: { totalNetProfit: -1 } },
    ]);
    return ok(res, summary);
  } catch (err) { return serverError(res, err); }
};
