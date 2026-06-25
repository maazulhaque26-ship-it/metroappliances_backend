const mongoose         = require('mongoose');
const RFIDTag          = require('../models/RFIDTag');
const RFIDScan         = require('../models/RFIDScan');
const WarehouseDevice  = require('../models/WarehouseDevice');
const DeviceHealth     = require('../models/DeviceHealth');
const Sensor           = require('../models/Sensor');
const SensorReading    = require('../models/SensorReading');
const Alert            = require('../models/Alert');
const ReplenishmentTask= require('../models/ReplenishmentTask');
const VoicePickingSession = require('../models/VoicePickingSession');
const { ok, fail, serverError } = require('../utils/response');

function dateRange(days) {
  return new Date(Date.now() - days * 86_400_000);
}

// ── Admin: RFID accuracy report ───────────────────────────────────────────────
exports.getRFIDAccuracyReport = async (req, res) => {
  try {
    const { warehouseId, days = 30 } = req.query;
    const since = dateRange(days);
    const filter = { scannedAt: { $gte: since } };
    if (warehouseId) filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);

    const [total, unknown, duplicates] = await Promise.all([
      RFIDScan.countDocuments(filter),
      RFIDScan.countDocuments({ ...filter, isUnknown: true }),
      RFIDScan.countDocuments({ ...filter, isDuplicate: true }),
    ]);
    const known    = total - unknown - duplicates;
    const accuracy = total ? ((known / total) * 100).toFixed(1) : 0;

    const daily = await RFIDScan.aggregate([
      { $match: filter },
      { $group: {
        _id:        { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
        scans:      { $sum: 1 },
        unknown:    { $sum: { $cond: ['$isUnknown', 1, 0] } },
        duplicates: { $sum: { $cond: ['$isDuplicate', 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    return ok(res, { total, known, unknown, duplicates, accuracy, daily, days });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: warehouse efficiency report ───────────────────────────────────────
exports.getWarehouseEfficiencyReport = async (req, res) => {
  try {
    const { warehouseId, days = 30 } = req.query;
    if (!warehouseId) return fail(res, 'warehouseId required');
    const since = dateRange(days);

    const VoicePickingSession_ = VoicePickingSession;
    const ReplenishmentTask_   = ReplenishmentTask;
    const InventoryLog = require('../models/InventoryLog');

    const [completedPicks, totalPicks, pendingReplen, criticalAlerts] = await Promise.all([
      VoicePickingSession_.countDocuments({ warehouseId, status: 'completed', completedAt: { $gte: since } }),
      VoicePickingSession_.countDocuments({ warehouseId, createdAt: { $gte: since } }),
      ReplenishmentTask_.countDocuments({ warehouseId, status: { $in: ['pending', 'approved'] } }),
      Alert.countDocuments({ warehouseId, severity: 'critical', createdAt: { $gte: since } }),
    ]);

    const avgAccuracy = await VoicePickingSession_.aggregate([
      { $match: { warehouseId: new mongoose.Types.ObjectId(warehouseId), status: 'completed', completedAt: { $gte: since } } },
      { $group: { _id: null, avgAccuracy: { $avg: { $toDouble: '$accuracy' } } } },
    ]);

    return ok(res, {
      pickingCompletionRate: totalPicks ? ((completedPicks / totalPicks) * 100).toFixed(1) : 0,
      avgPickingAccuracy:    avgAccuracy[0]?.avgAccuracy?.toFixed(1) || 0,
      pendingReplenishment:  pendingReplen,
      criticalAlertsRaised:  criticalAlerts,
      days,
    });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: device uptime report ───────────────────────────────────────────────
exports.getDeviceUptimeReport = async (req, res) => {
  try {
    const { warehouseId, days = 7 } = req.query;
    const since = dateRange(days);
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;

    const devices = await WarehouseDevice.find(filter).lean();
    const uptimeData = [];

    for (const d of devices.slice(0, 50)) {
      const health = await DeviceHealth.find({ deviceId: d._id, timestamp: { $gte: since } })
        .sort({ timestamp: 1 }).lean();
      const total   = health.length;
      const online  = health.filter(h => h.isOnline).length;
      const uptime  = total ? ((online / total) * 100).toFixed(1) : null;
      uptimeData.push({ deviceId: d.deviceId, name: d.name, type: d.type, status: d.status, uptimePct: uptime, readings: total });
    }

    return ok(res, { devices: uptimeData, days });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: alert history report ───────────────────────────────────────────────
exports.getAlertHistoryReport = async (req, res) => {
  try {
    const { warehouseId, days = 30 } = req.query;
    const since = dateRange(days);
    const filter = { createdAt: { $gte: since } };
    if (warehouseId) filter.warehouseId = warehouseId;

    const [total, bySeverity, byType, daily] = await Promise.all([
      Alert.countDocuments(filter),
      Alert.aggregate([{ $match: filter }, { $group: { _id: '$severity', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Alert.aggregate([{ $match: filter }, { $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Alert.aggregate([
        { $match: filter },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const resolved = await Alert.countDocuments({ ...filter, status: 'resolved' });
    const resolutionRate = total ? ((resolved / total) * 100).toFixed(1) : 0;

    return ok(res, { total, resolved, resolutionRate, bySeverity, byType, daily, days });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: sensor history report ──────────────────────────────────────────────
exports.getSensorHistoryReport = async (req, res) => {
  try {
    const { warehouseId, sensorType, days = 7 } = req.query;
    const since = dateRange(days);
    const sensorFilter = { isActive: true };
    if (warehouseId) sensorFilter.warehouseId = warehouseId;
    if (sensorType)  sensorFilter.type        = sensorType;

    const sensors = await Sensor.find(sensorFilter).lean();
    const sensorIds = sensors.map(s => s._id);

    const stats = await SensorReading.aggregate([
      { $match: { sensorId: { $in: sensorIds }, timestamp: { $gte: since } } },
      { $group: {
        _id:      '$sensorId',
        avgValue: { $avg: '$value' },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' },
        anomalies:{ $sum: { $cond: ['$isAnomaly', 1, 0] } },
        readings: { $sum: 1 },
      }},
    ]);

    const sensorMap = Object.fromEntries(sensors.map(s => [s._id.toString(), s]));
    const report = stats.map(s => ({
      ...s,
      sensor: sensorMap[s._id.toString()],
    }));

    return ok(res, { report, days, sensorType: sensorType || 'all' });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: replenishment efficiency report ────────────────────────────────────
exports.getReplenishmentReport = async (req, res) => {
  try {
    const { warehouseId, days = 30 } = req.query;
    const since = dateRange(days);
    const filter = { createdAt: { $gte: since } };
    if (warehouseId) filter.warehouseId = warehouseId;

    const [total, approved, ordered, received, cancelled, byTrigger, byPriority] = await Promise.all([
      ReplenishmentTask.countDocuments(filter),
      ReplenishmentTask.countDocuments({ ...filter, status: 'approved' }),
      ReplenishmentTask.countDocuments({ ...filter, status: 'ordered' }),
      ReplenishmentTask.countDocuments({ ...filter, status: 'received' }),
      ReplenishmentTask.countDocuments({ ...filter, status: 'cancelled' }),
      ReplenishmentTask.aggregate([{ $match: filter }, { $group: { _id: '$triggerType', count: { $sum: 1 } } }]),
      ReplenishmentTask.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    return ok(res, { total, approved, ordered, received, cancelled, byTrigger, byPriority, days });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: voice picking accuracy report ─────────────────────────────────────
exports.getVoicePickingReport = async (req, res) => {
  try {
    const { warehouseId, days = 30 } = req.query;
    const since = dateRange(days);
    const filter = { createdAt: { $gte: since } };
    if (warehouseId) filter.warehouseId = warehouseId;

    const [total, completed, abandoned] = await Promise.all([
      VoicePickingSession.countDocuments(filter),
      VoicePickingSession.countDocuments({ ...filter, status: 'completed' }),
      VoicePickingSession.countDocuments({ ...filter, status: 'abandoned' }),
    ]);

    const [accuracyAgg, durationAgg] = await Promise.all([
      VoicePickingSession.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: null, avg: { $avg: { $toDouble: '$accuracy' } }, min: { $min: { $toDouble: '$accuracy' } } } },
      ]),
      VoicePickingSession.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: null, avgMs: { $avg: '$totalDurationMs' } } },
      ]),
    ]);

    return ok(res, {
      total, completed, abandoned,
      completionRate:   total ? ((completed / total) * 100).toFixed(1) : 0,
      avgAccuracy:      accuracyAgg[0]?.avg?.toFixed(1) || 0,
      minAccuracy:      accuracyAgg[0]?.min?.toFixed(1) || 0,
      avgDurationMin:   durationAgg[0]?.avgMs ? (durationAgg[0].avgMs / 60_000).toFixed(1) : 0,
      days,
    });
  } catch (err) { return serverError(res, err); }
};
