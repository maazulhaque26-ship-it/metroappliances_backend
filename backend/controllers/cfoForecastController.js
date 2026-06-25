'use strict';
const FinancialForecast = require('../models/FinancialForecast');
const ForecastLine      = require('../models/ForecastLine');
const AuditLog          = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, serverError } = require('../utils/response');

const logAudit = (req, action, entity, entityId, entityLabel, before, after) =>
  AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action, entity, entityId, entityLabel, changes: { before, after }, ip: req.ip, userAgent: req.get('user-agent') }).catch(() => {});

// ── Forecasts ─────────────────────────────────────────────────────────────────
exports.getForecasts = async (req, res) => {
  try {
    const { page = 1, limit = 20, scenario, forecastType, status } = req.query;
    const filter = { isDeleted: false };
    if (scenario)     filter.scenario     = scenario;
    if (forecastType) filter.forecastType = forecastType;
    if (status)       filter.status       = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await FinancialForecast.countDocuments(filter);
    const data  = await FinancialForecast.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('approvedBy', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getForecast = async (req, res) => {
  try {
    const doc = await FinancialForecast.findOne({ _id: req.params.id, isDeleted: false })
      .populate('approvedBy', 'name');
    if (!doc) return notFound(res, 'Forecast');
    const lines = await ForecastLine.find({ forecast: doc._id, isDeleted: false }).sort({ period: 1, category: 1 });
    return ok(res, { forecast: doc, lines });
  } catch (err) { return serverError(res, err); }
};

exports.createForecast = async (req, res) => {
  try {
    const doc = await FinancialForecast.create(req.body);
    logAudit(req, 'FORECAST_CREATED', 'FinancialForecast', doc._id, doc.forecastName, null, doc.toObject());
    const io = req.app.locals.io;
    if (io) io.emit('cfo:forecast_updated', { forecast: { _id: doc._id, forecastName: doc.forecastName, scenario: doc.scenario } });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateForecast = async (req, res) => {
  try {
    const doc = await FinancialForecast.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Forecast');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    logAudit(req, 'FORECAST_UPDATED', 'FinancialForecast', doc._id, doc.forecastName, before, doc.toObject());
    const io = req.app.locals.io;
    if (io) io.emit('cfo:forecast_updated', { forecast: { _id: doc._id, forecastName: doc.forecastName, scenario: doc.scenario } });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.approveForecast = async (req, res) => {
  try {
    const doc = await FinancialForecast.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Forecast');
    const before = doc.toObject();
    doc.status     = 'approved';
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    await doc.save();
    logAudit(req, 'FORECAST_APPROVED', 'FinancialForecast', doc._id, doc.forecastName, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteForecast = async (req, res) => {
  try {
    const doc = await FinancialForecast.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Forecast');
    doc.isDeleted = true; await doc.save();
    logAudit(req, 'FORECAST_DELETED', 'FinancialForecast', doc._id, doc.forecastName, doc.toObject(), null);
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Forecast Lines ────────────────────────────────────────────────────────────
exports.getForecastLines = async (req, res) => {
  try {
    const lines = await ForecastLine.find({ forecast: req.params.id, isDeleted: false })
      .sort({ period: 1, category: 1 }).populate('account', 'accountName accountCode');
    return ok(res, lines);
  } catch (err) { return serverError(res, err); }
};

exports.createForecastLine = async (req, res) => {
  try {
    const line = await ForecastLine.create({ ...req.body, forecast: req.params.id });
    return created(res, line);
  } catch (err) { return serverError(res, err); }
};

exports.updateForecastLine = async (req, res) => {
  try {
    const line = await ForecastLine.findOneAndUpdate(
      { _id: req.params.lineId, isDeleted: false }, req.body, { new: true }
    );
    if (!line) return notFound(res, 'ForecastLine');
    return ok(res, line);
  } catch (err) { return serverError(res, err); }
};

exports.deleteForecastLine = async (req, res) => {
  try {
    const line = await ForecastLine.findOneAndUpdate(
      { _id: req.params.lineId, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!line) return notFound(res, 'ForecastLine');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Forecast Variance ─────────────────────────────────────────────────────────
exports.getForecastVariance = async (req, res) => {
  try {
    const forecasts = await FinancialForecast.find({ isDeleted: false, status: 'approved' })
      .sort({ startDate: -1 }).limit(12)
      .select('forecastName scenario startDate totalRevenue totalExpenses grossProfit netProfit');
    return ok(res, forecasts);
  } catch (err) { return serverError(res, err); }
};
