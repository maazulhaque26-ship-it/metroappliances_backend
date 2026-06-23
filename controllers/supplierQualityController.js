'use strict';
const SupplierQualityRecord = require('../models/SupplierQualityRecord');
const QualityAlert = require('../models/QualityAlert');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/response');

// ── Supplier Quality Records ──────────────────────────────────────────────────
exports.getSupplierQualityRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, vendorId, recordType, supplierStatus, search } = req.query;
    const filter = { isDeleted: false };
    if (vendorId) filter.vendor = vendorId;
    if (recordType) filter.recordType = recordType;
    if (supplierStatus) filter.supplierStatus = supplierStatus;
    if (search) filter.$or = [
      { recordNumber: { $regex: search, $options: 'i' } },
      { vendorName: { $regex: search, $options: 'i' } },
      { vendorCode: { $regex: search, $options: 'i' } },
    ];
    const total = await SupplierQualityRecord.countDocuments(filter);
    const data = await SupplierQualityRecord.find(filter)
      .populate('vendor', 'name vendorCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Supplier quality records retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createSupplierQualityRecord = async (req, res) => {
  try {
    const record = await SupplierQualityRecord.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'SupplierQualityRecord', entityId: record._id, entityLabel: record.recordNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, record, 'Supplier quality record created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getSupplierQualityRecord = async (req, res) => {
  try {
    const record = await SupplierQualityRecord.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name vendorCode contactPerson')
      .populate('product', 'name sku')
      .populate('capa', 'capaNumber status');
    if (!record) return error(res, 'Record not found', 404);
    return success(res, record);
  } catch (err) { return error(res, err.message); }
};

exports.updateSupplierQualityRecord = async (req, res) => {
  try {
    const before = await SupplierQualityRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Record not found', 404);
    const record = await SupplierQualityRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'SupplierQualityRecord', entityId: record._id, entityLabel: record.recordNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, record, 'Record updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteSupplierQualityRecord = async (req, res) => {
  try {
    const record = await SupplierQualityRecord.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!record) return error(res, 'Record not found', 404);
    return success(res, null, 'Record deleted');
  } catch (err) { return error(res, err.message); }
};

exports.getSupplierScorecard = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const records = await SupplierQualityRecord.find({ vendor: vendorId, isDeleted: false }).sort({ recordDate: -1 }).limit(50);
    if (!records.length) return success(res, { vendorId, records: [], summary: {} });
    const sum = records.reduce((acc, r) => {
      acc.qualityScore += r.qualityScore;
      acc.deliveryScore += r.deliveryScore;
      acc.serviceScore += r.serviceScore;
      acc.overallScore += r.overallScore;
      return acc;
    }, { qualityScore: 0, deliveryScore: 0, serviceScore: 0, overallScore: 0 });
    const n = records.length;
    const summary = {
      avgQualityScore: Math.round(sum.qualityScore / n),
      avgDeliveryScore: Math.round(sum.deliveryScore / n),
      avgServiceScore: Math.round(sum.serviceScore / n),
      avgOverallScore: Math.round(sum.overallScore / n),
      totalRecords: n,
      latestStatus: records[0].supplierStatus,
    };
    return success(res, { vendorId, records, summary });
  } catch (err) { return error(res, err.message); }
};

// ── Quality Alerts ────────────────────────────────────────────────────────────
exports.getQualityAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity, alertType } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (alertType) filter.alertType = alertType;
    const total = await QualityAlert.countDocuments(filter);
    const data = await QualityAlert.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Quality alerts retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createQualityAlert = async (req, res) => {
  try {
    const alert = await QualityAlert.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('qms:quality_alert', { id: alert._id, alertNumber: alert.alertNumber, severity: alert.severity, alertType: alert.alertType });
    return success(res, alert, 'Quality alert created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateQualityAlert = async (req, res) => {
  try {
    const alert = await QualityAlert.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!alert) return error(res, 'Alert not found', 404);
    return success(res, alert, 'Alert updated');
  } catch (err) { return error(res, err.message); }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await QualityAlert.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'open' },
      { status: 'acknowledged', acknowledgedBy: req.user._id, acknowledgedByName: req.user.name, acknowledgedAt: new Date() },
      { new: true }
    );
    if (!alert) return error(res, 'Alert not found or already acknowledged', 404);
    return success(res, alert, 'Alert acknowledged');
  } catch (err) { return error(res, err.message); }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { resolution } = req.body;
    const alert = await QualityAlert.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'resolved', resolvedBy: req.user._id, resolvedByName: req.user.name, resolvedAt: new Date(), resolution: resolution || '' },
      { new: true }
    );
    if (!alert) return error(res, 'Alert not found', 404);
    return success(res, alert, 'Alert resolved');
  } catch (err) { return error(res, err.message); }
};
