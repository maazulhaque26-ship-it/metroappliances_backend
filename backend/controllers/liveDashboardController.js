const mongoose         = require('mongoose');
const RFIDTag          = require('../models/RFIDTag');
const RFIDScan         = require('../models/RFIDScan');
const WarehouseDevice  = require('../models/WarehouseDevice');
const Sensor           = require('../models/Sensor');
const SensorReading    = require('../models/SensorReading');
const Alert            = require('../models/Alert');
const ReplenishmentTask= require('../models/ReplenishmentTask');
const VoicePickingSession = require('../models/VoicePickingSession');
const { ok, fail, serverError } = require('../utils/response');

// ── Admin: combined dashboard payload ────────────────────────────────────────
exports.getDashboardData = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    if (!warehouseId) return fail(res, 'warehouseId required');
    const wId = new mongoose.Types.ObjectId(warehouseId);
    const since1h  = new Date(Date.now() - 3_600_000);
    const since24h = new Date(Date.now() - 86_400_000);

    const [devices, activeAlerts, scans1h, rfidTags,
           sensors, criticalAlerts, replen, voiceSessions] = await Promise.all([
      WarehouseDevice.find({ warehouseId: wId, isActive: true }).lean(),
      Alert.find({ warehouseId: wId, status: { $in: ['active', 'acknowledged'] } }).sort({ createdAt: -1 }).limit(20).lean(),
      RFIDScan.countDocuments({ warehouseId: wId, scannedAt: { $gte: since1h } }),
      RFIDTag.countDocuments({ warehouseId: wId, status: 'active' }),
      Sensor.find({ warehouseId: wId, isActive: true }).lean(),
      Alert.countDocuments({ warehouseId: wId, status: 'active', severity: 'critical' }),
      ReplenishmentTask.countDocuments({ warehouseId: wId, status: { $in: ['pending', 'approved'] } }),
      VoicePickingSession.countDocuments({ warehouseId: wId, status: 'active' }),
    ]);

    const deviceStats = {
      total:   devices.length,
      online:  devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      lowBattery: devices.filter(d => d.batteryLevel < 20).length,
    };

    const sensorLatest = {};
    for (const s of sensors) {
      if (s.lastReading) {
        sensorLatest[s.type] = sensorLatest[s.type] || [];
        sensorLatest[s.type].push({ sensorId: s._id, name: s.name, zoneId: s.zoneId, ...s.lastReading });
      }
    }

    return ok(res, {
      warehouseId,
      rfid:         { activeTags: rfidTags, scansLastHour: scans1h },
      devices:      deviceStats,
      alerts:       { active: activeAlerts.length, critical: criticalAlerts, recent: activeAlerts.slice(0, 5) },
      sensors:      { total: sensors.length, fault: sensors.filter(s => s.status === 'fault').length, latest: sensorLatest },
      replenishment:{ pending: replen },
      voice:        { activeSessions: voiceSessions },
    });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: inventory movement widget ─────────────────────────────────────────
exports.getInventoryMovement = async (req, res) => {
  try {
    const { warehouseId, hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 3_600_000);

    const InventoryLog = require('../models/InventoryLog');
    const filter = { createdAt: { $gte: since } };
    if (warehouseId) filter.warehouseId = warehouseId;

    const movements = await InventoryLog.aggregate([
      { $match: filter },
      { $group: { _id: '$adjustmentType', count: { $sum: 1 }, qty: { $sum: { $abs: '$quantityChange' } } } },
      { $sort: { count: -1 } },
    ]);

    return ok(res, { movements, windowHours: hours });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: device health widget ───────────────────────────────────────────────
exports.getDeviceHealth = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;

    const devices = await WarehouseDevice.find(filter).lean();
    const health = devices.map(d => ({
      _id:          d._id,
      deviceId:     d.deviceId,
      name:         d.name,
      type:         d.type,
      status:       d.status,
      batteryLevel: d.batteryLevel,
      signalStrength: d.signalStrength,
      lastSeen:     d.lastSeen,
    }));

    return ok(res, health);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: RFID activity stream ───────────────────────────────────────────────
exports.getRFIDActivity = async (req, res) => {
  try {
    const { warehouseId, limit = 50 } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    const scans = await RFIDScan.find(filter).sort({ scannedAt: -1 }).limit(+limit).lean();
    return ok(res, scans);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: active alerts for dashboard ───────────────────────────────────────
exports.getActiveAlerts = async (req, res) => {
  try {
    const { warehouseId, limit = 20 } = req.query;
    const filter = { status: { $in: ['active', 'acknowledged'] } };
    if (warehouseId) filter.warehouseId = warehouseId;
    const alerts = await Alert.find(filter).sort({ severity: 1, createdAt: -1 }).limit(+limit).lean();
    return ok(res, alerts);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: warehouse queue status ─────────────────────────────────────────────
exports.getQueueStatus = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseId = warehouseId;

    const Dispatch     = require('../models/Dispatch');
    const PickingList  = require('../models/PickingList');
    const StockTransfer = require('../models/StockTransfer');

    const [pendingDispatches, activePicking, pendingTransfers] = await Promise.all([
      Dispatch.countDocuments({ ...filter, status: { $in: ['pending', 'processing'] } }),
      PickingList.countDocuments({ ...filter, status: { $in: ['pending', 'in_progress'] } }),
      StockTransfer.countDocuments({ ...filter, status: 'pending' }),
    ]);

    return ok(res, { pendingDispatches, activePicking, pendingTransfers });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: warehouse occupancy ────────────────────────────────────────────────
exports.getWarehouseOccupancy = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    if (!warehouseId) return fail(res, 'warehouseId required');

    const StorageLocation = require('../models/StorageLocation');
    const bins = await StorageLocation.find({ warehouseId, isActive: true }).lean();

    const total    = bins.length;
    const occupied = bins.filter(b => (b.currentCapacity || 0) > 0).length;
    const full     = bins.filter(b => b.maxCapacity && (b.currentCapacity || 0) >= b.maxCapacity).length;
    const avgUtil  = total ? (bins.reduce((acc, b) => acc + (b.maxCapacity ? (b.currentCapacity || 0) / b.maxCapacity : 0), 0) / total * 100).toFixed(1) : 0;

    return ok(res, { total, occupied, empty: total - occupied, full, avgUtilizationPct: avgUtil });
  } catch (err) { return serverError(res, err); }
};
