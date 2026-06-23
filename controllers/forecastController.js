'use strict';
const DemandForecast = require('../models/DemandForecast');
const AuditLog       = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, fail, serverError } = require('../utils/response');

exports.getForecasts = async (req, res) => {
  try {
    const { page = 1, limit = 20, product, factory, forecastPeriod, isApproved } = req.query;
    const filter = { isDeleted: false };
    if (product)        filter.product        = product;
    if (factory)        filter.factory        = factory;
    if (forecastPeriod) filter.forecastPeriod = forecastPeriod;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DemandForecast.countDocuments(filter);
    const data  = await DemandForecast.find(filter)
      .sort({ periodStart: -1 })
      .skip(skip).limit(Number(limit))
      .populate('product',  'name sku')
      .populate('factory',  'name')
      .populate('approvedBy', 'name');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getForecast = async (req, res) => {
  try {
    const doc = await DemandForecast.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product',    'name sku')
      .populate('factory',    'name')
      .populate('approvedBy', 'name');
    if (!doc) return notFound(res, 'Demand forecast not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createForecast = async (req, res) => {
  try {
    const { product, productName, productSKU, factory, forecastPeriod, periodStart, periodEnd, forecastQty, method, confidenceLevel, unit, source, notes } = req.body;
    if (!product || !periodStart || !periodEnd || forecastQty === undefined) return fail(res, 'product, periodStart, periodEnd and forecastQty are required');
    const doc = await DemandForecast.create({ product, productName, productSKU, factory, forecastPeriod, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd), forecastQty, method, confidenceLevel, unit, source, notes });
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'create', entity: 'DemandForecast',
      entityId: doc._id, entityLabel: `${doc.productName} ${doc.periodStart?.toISOString().slice(0,7)}`,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Demand forecast created');
  } catch (err) { return serverError(res, err); }
};

exports.updateForecast = async (req, res) => {
  try {
    const doc = await DemandForecast.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Demand forecast not found');
    if (doc.isApproved) return fail(res, 'Approved forecasts cannot be edited');
    const before = doc.toObject();
    const allowed = ['forecastQty','actualQty','method','confidenceLevel','unit','source','notes','periodStart','periodEnd','forecastPeriod'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'update', entity: 'DemandForecast',
      entityId: doc._id, entityLabel: doc.productName,
      changes: { before, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Forecast updated');
  } catch (err) { return serverError(res, err); }
};

exports.approveForecast = async (req, res) => {
  try {
    const doc = await DemandForecast.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Demand forecast not found');
    if (doc.isApproved) return fail(res, 'Already approved');
    doc.isApproved    = true;
    doc.approvedBy    = req.user?._id;
    doc.approvedByName= req.user?.name || '';
    await doc.save();
    return ok(res, doc, 'Forecast approved');
  } catch (err) { return serverError(res, err); }
};

exports.deleteForecast = async (req, res) => {
  try {
    const doc = await DemandForecast.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Demand forecast not found');
    if (doc.isApproved) return fail(res, 'Approved forecasts cannot be deleted');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};
