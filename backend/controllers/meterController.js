'use strict';
const AssetMeter  = require('../models/AssetMeter');
const MeterReading = require('../models/MeterReading');
const AuditLog    = require('../models/AuditLog');
const { success, error, paginated, notFound, serverError } = require('../utils/response');

// ── Asset Meters ──────────────────────────────────────────────────────────────

exports.getMeters = async (req, res) => {
  try {
    const { page = 1, limit = 20, assetId, meterType, isActive } = req.query;
    const filter = { isDeleted: false };
    if (assetId) filter.asset = assetId;
    if (meterType) filter.meterType = meterType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AssetMeter.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AssetMeter.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getMeter = async (req, res) => {
  try {
    const meter = await AssetMeter.findOne({ _id: req.params.id, isDeleted: false })
      .populate('asset', 'name assetNumber assetType');
    if (!meter) return notFound(res, 'Meter not found');
    const recentReadings = await MeterReading.find({ assetMeter: meter._id }).sort({ readingDate: -1 }).limit(50);
    return success(res, { meter, readings: recentReadings });
  } catch (e) { return serverError(res, e.message); }
};

exports.createMeter = async (req, res) => {
  try {
    const meter = await AssetMeter.create(req.body);
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'AssetMeter',
      entityId: meter._id, entityLabel: meter.meterNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, meter, 'Meter created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateMeter = async (req, res) => {
  try {
    const meter = await AssetMeter.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!meter) return notFound(res, 'Meter not found');
    return success(res, meter, 'Meter updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteMeter = async (req, res) => {
  try {
    const meter = await AssetMeter.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!meter) return notFound(res, 'Meter not found');
    return success(res, null, 'Meter deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Meter Readings ────────────────────────────────────────────────────────────

exports.getReadings = async (req, res) => {
  try {
    const { page = 1, limit = 50, from, to } = req.query;
    const filter = { assetMeter: req.params.meterId };
    if (from || to) {
      filter.readingDate = {};
      if (from) filter.readingDate.$gte = new Date(from);
      if (to) filter.readingDate.$lte = new Date(to);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MeterReading.find(filter).sort({ readingDate: -1 }).skip(skip).limit(Number(limit)),
      MeterReading.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.addReading = async (req, res) => {
  try {
    const meter = await AssetMeter.findOne({ _id: req.params.meterId, isDeleted: false });
    if (!meter) return notFound(res, 'Meter not found');

    const { readingValue, readingDate } = req.body;

    // Check thresholds
    const isThresholdBreached = meter.maintenanceThreshold && readingValue >= meter.maintenanceThreshold;
    const isMaintenanceTriggered = isThresholdBreached;
    const isWarning = meter.warningThreshold && readingValue >= meter.warningThreshold;
    const isCritical = meter.criticalThreshold && readingValue >= meter.criticalThreshold;

    const reading = await MeterReading.create({
      ...req.body,
      assetMeter: meter._id,
      asset: meter.asset,
      isThresholdBreached,
      isMaintenanceTriggered,
    });

    // Update meter current value
    await AssetMeter.findByIdAndUpdate(meter._id, {
      currentValue: readingValue,
      lastReadingDate: readingDate || new Date(),
    });

    const io = req.app.locals.io;
    if (io && (isWarning || isCritical)) {
      io.emit('eam:meter_threshold', {
        meterId: meter._id, meterNumber: meter.meterNumber,
        assetId: meter.asset, readingValue,
        threshold: isCritical ? 'critical' : 'warning',
        maintenanceTriggered: isMaintenanceTriggered,
      });
    }

    return success(res, reading, 'Reading added', 201);
  } catch (e) { return serverError(res, e.message); }
};
