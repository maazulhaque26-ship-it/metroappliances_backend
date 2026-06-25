const WarehouseDevice = require('../models/WarehouseDevice');
const DeviceHealth    = require('../models/DeviceHealth');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

function emitDevice(req, event, data) {
  const io = req.app.locals.io;
  if (io) io.emit(`device:${event}`, data);
}

// ── Admin: register device ────────────────────────────────────────────────────
exports.registerDevice = async (req, res) => {
  try {
    const device = await WarehouseDevice.create(req.body);
    emitDevice(req, 'registered', { device });
    return created(res, device, 'Device registered');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: list devices ───────────────────────────────────────────────────────
exports.getDevices = async (req, res) => {
  try {
    const { warehouseId, type, status, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (type)        filter.type        = type;
    if (status)      filter.status      = status;
    const total   = await WarehouseDevice.countDocuments(filter);
    const devices = await WarehouseDevice.find(filter)
      .sort({ lastSeen: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .lean();
    return paginated(res, devices, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: single device ──────────────────────────────────────────────────────
exports.getDevice = async (req, res) => {
  try {
    const device = await WarehouseDevice.findById(req.params.id).lean();
    if (!device) return notFound(res, 'WarehouseDevice');
    const latestHealth = await DeviceHealth.findOne({ deviceId: device._id })
      .sort({ timestamp: -1 }).lean();
    return ok(res, { device, latestHealth });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: update device ──────────────────────────────────────────────────────
exports.updateDevice = async (req, res) => {
  try {
    const device = await WarehouseDevice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return notFound(res, 'WarehouseDevice');
    return ok(res, device, 'Device updated');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: soft-delete device ─────────────────────────────────────────────────
exports.deleteDevice = async (req, res) => {
  try {
    const device = await WarehouseDevice.findByIdAndUpdate(req.params.id, { isActive: false, status: 'decommissioned' }, { new: true });
    if (!device) return notFound(res, 'WarehouseDevice');
    return ok(res, null, 'Device decommissioned');
  } catch (err) { return serverError(res, err); }
};

// ── Device: record health heartbeat ──────────────────────────────────────────
exports.recordHealth = async (req, res) => {
  try {
    const { id } = req.params;
    const { batteryLevel, signalStrength, memoryUsageMB, cpuPercent,
            temperatureCelsius, errorCode, errorMessage, isOnline = true, responseTimeMs } = req.body;
    const device = await WarehouseDevice.findById(id);
    if (!device) return notFound(res, 'WarehouseDevice');

    const health = await DeviceHealth.create({
      deviceId: device._id,
      batteryLevel, signalStrength, memoryUsageMB, cpuPercent,
      temperatureCelsius, errorCode, errorMessage, isOnline, responseTimeMs,
      timestamp: new Date(),
    });

    const updateFields = { lastSeen: new Date() };
    if (batteryLevel !== undefined) updateFields.batteryLevel = batteryLevel;
    if (signalStrength !== undefined) updateFields.signalStrength = signalStrength;
    if (!isOnline) updateFields.status = 'offline';
    else if (device.status === 'offline') updateFields.status = 'online';

    await WarehouseDevice.findByIdAndUpdate(id, updateFields);

    if (batteryLevel !== undefined && batteryLevel < 15) {
      const Alert = require('../models/Alert');
      const io = req.app.locals.io;
      const a = await Alert.create({
        type: 'battery_low', severity: 'medium',
        title: `Low Battery: ${device.name}`,
        message: `Device ${device.deviceId} battery at ${batteryLevel}%`,
        details: { deviceId: device._id, batteryLevel },
        warehouseId: device.warehouseId,
        entityType: 'WarehouseDevice', entityId: device._id,
      });
      if (io) io.emit('alert:created', { alert: a });
    }

    emitDevice(req, 'health', { deviceId: device._id, batteryLevel, signalStrength, isOnline });
    return created(res, health, 'Health recorded');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: device health history ──────────────────────────────────────────────
exports.getHealthHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 3_600_000);
    const history = await DeviceHealth.find({ deviceId: id, timestamp: { $gte: since } })
      .sort({ timestamp: -1 }).limit(500).lean();
    return ok(res, history);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: assign device to warehouse user ────────────────────────────────────
exports.assignDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const device = await WarehouseDevice.findByIdAndUpdate(id,
      { assignedUserId: userId, assignedAt: new Date() }, { new: true });
    if (!device) return notFound(res, 'WarehouseDevice');
    return ok(res, device, 'Device assigned');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: unassign device ────────────────────────────────────────────────────
exports.unassignDevice = async (req, res) => {
  try {
    const device = await WarehouseDevice.findByIdAndUpdate(req.params.id,
      { $unset: { assignedUserId: 1, assignedAt: 1 } }, { new: true });
    if (!device) return notFound(res, 'WarehouseDevice');
    return ok(res, device, 'Device unassigned');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: device stats ───────────────────────────────────────────────────────
exports.getDeviceStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;

    const [total, online, offline, maintenance, lowBattery] = await Promise.all([
      WarehouseDevice.countDocuments(filter),
      WarehouseDevice.countDocuments({ ...filter, status: 'online' }),
      WarehouseDevice.countDocuments({ ...filter, status: 'offline' }),
      WarehouseDevice.countDocuments({ ...filter, status: 'maintenance' }),
      WarehouseDevice.countDocuments({ ...filter, batteryLevel: { $lt: 20 } }),
    ]);

    const byType = await WarehouseDevice.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 }, online: { $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);

    return ok(res, { total, online, offline, maintenance, lowBattery, byType });
  } catch (err) { return serverError(res, err); }
};
