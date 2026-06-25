'use strict';
const Gauge = require('../models/Gauge');
const GaugeHistory = require('../models/GaugeHistory');
const CalibrationRecord = require('../models/CalibrationRecord');
const CalibrationSchedule = require('../models/CalibrationSchedule');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/response');

// ── Gauges ────────────────────────────────────────────────────────────────────
exports.getGauges = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, calibrationStatus, gaugeType, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (calibrationStatus) filter.calibrationStatus = calibrationStatus;
    if (gaugeType) filter.gaugeType = gaugeType;
    if (search) filter.$or = [
      { gaugeNumber: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { serialNumber: { $regex: search, $options: 'i' } },
    ];
    const total = await Gauge.countDocuments(filter);
    const data = await Gauge.find(filter)
      .sort({ nextCalibrationDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Gauges retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createGauge = async (req, res) => {
  try {
    const gauge = await Gauge.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'Gauge', entityId: gauge._id, entityLabel: gauge.gaugeNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    await GaugeHistory.create({ gauge: gauge._id, gaugeNumber: gauge.gaugeNumber, eventType: 'status_change', description: 'Gauge registered', newStatus: gauge.status });
    return success(res, gauge, 'Gauge created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getGauge = async (req, res) => {
  try {
    const gauge = await Gauge.findOne({ _id: req.params.id, isDeleted: false });
    if (!gauge) return error(res, 'Gauge not found', 404);
    const [history, calibrations, upcomingSchedules] = await Promise.all([
      GaugeHistory.find({ gauge: gauge._id }).sort({ eventDate: -1 }).limit(20),
      CalibrationRecord.find({ gauge: gauge._id, isDeleted: false }).sort({ calibrationDate: -1 }).limit(10),
      CalibrationSchedule.find({ gauge: gauge._id, isDeleted: false, status: { $in: ['scheduled','overdue'] } }).sort({ scheduledDate: 1 }),
    ]);
    return success(res, { gauge, history, calibrations, upcomingSchedules });
  } catch (err) { return error(res, err.message); }
};

exports.updateGauge = async (req, res) => {
  try {
    const before = await Gauge.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Gauge not found', 404);
    const gauge = await Gauge.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (before.status !== gauge.status) {
      await GaugeHistory.create({ gauge: gauge._id, gaugeNumber: gauge.gaugeNumber, eventType: 'status_change', previousStatus: before.status, newStatus: gauge.status });
    }
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'Gauge', entityId: gauge._id, entityLabel: gauge.gaugeNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, gauge, 'Gauge updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteGauge = async (req, res) => {
  try {
    const gauge = await Gauge.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!gauge) return error(res, 'Gauge not found', 404);
    return success(res, null, 'Gauge deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Calibration Records ───────────────────────────────────────────────────────
exports.getCalibrationRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, gaugeId, overallResult } = req.query;
    const filter = { isDeleted: false };
    if (gaugeId) filter.gauge = gaugeId;
    if (overallResult) filter.overallResult = overallResult;
    const total = await CalibrationRecord.countDocuments(filter);
    const data = await CalibrationRecord.find(filter)
      .populate('gauge', 'gaugeNumber name gaugeType')
      .sort({ calibrationDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Calibration records retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createCalibrationRecord = async (req, res) => {
  try {
    const record = await CalibrationRecord.create(req.body);
    // Update gauge calibration dates and status
    const gaugeUpdate = { lastCalibrationDate: record.calibrationDate, calibrationStatus: record.overallResult === 'pass' ? 'calibrated' : 'out_of_service' };
    if (record.nextCalibrationDate) gaugeUpdate.nextCalibrationDate = record.nextCalibrationDate;
    await Gauge.findByIdAndUpdate(record.gauge, gaugeUpdate);
    // Log to gauge history
    await GaugeHistory.create({ gauge: record.gauge, gaugeNumber: record.gaugeNumber, eventType: 'calibration', calibrationResult: record.overallResult, calibrationCertNo: record.certificateNumber, calibrationDate: record.calibrationDate, nextCalibrationDate: record.nextCalibrationDate, performedBy: record.calibratedBy, cost: record.cost });
    // Close any related schedule
    if (record.calibrationSchedule) {
      await CalibrationSchedule.findByIdAndUpdate(record.calibrationSchedule, { status: 'completed', completedDate: record.calibrationDate, calibrationRecord: record._id });
    }
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'CalibrationRecord', entityId: record._id, entityLabel: record.recordNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, record, 'Calibration record created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getCalibrationRecord = async (req, res) => {
  try {
    const record = await CalibrationRecord.findOne({ _id: req.params.id, isDeleted: false })
      .populate('gauge', 'gaugeNumber name gaugeType');
    if (!record) return error(res, 'Calibration record not found', 404);
    return success(res, record);
  } catch (err) { return error(res, err.message); }
};

// ── Calibration Schedules ─────────────────────────────────────────────────────
exports.getCalibrationSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, gaugeId } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (gaugeId) filter.gauge = gaugeId;
    const total = await CalibrationSchedule.countDocuments(filter);
    const data = await CalibrationSchedule.find(filter)
      .populate('gauge', 'gaugeNumber name gaugeType calibrationStatus')
      .sort({ scheduledDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Calibration schedules retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createCalibrationSchedule = async (req, res) => {
  try {
    const gauge = await Gauge.findById(req.body.gauge);
    if (!gauge) return error(res, 'Gauge not found', 404);
    const schedule = await CalibrationSchedule.create({ ...req.body, gaugeName: gauge.name, gaugeNumber: gauge.gaugeNumber });
    return success(res, schedule, 'Calibration scheduled', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateCalibrationSchedule = async (req, res) => {
  try {
    const schedule = await CalibrationSchedule.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!schedule) return error(res, 'Schedule not found', 404);
    return success(res, schedule, 'Schedule updated');
  } catch (err) { return error(res, err.message); }
};

// ── Gauge History ─────────────────────────────────────────────────────────────
exports.getGaugeHistory = async (req, res) => {
  try {
    const { gaugeId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const filter = { gauge: gaugeId };
    const total = await GaugeHistory.countDocuments(filter);
    const data = await GaugeHistory.find(filter)
      .sort({ eventDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Gauge history retrieved');
  } catch (err) { return error(res, err.message); }
};
