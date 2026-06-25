const Sensor        = require('../models/Sensor');
const SensorReading = require('../models/SensorReading');
const Alert         = require('../models/Alert');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

async function checkThresholds(io, sensor, value) {
  const t = sensor.thresholds || {};
  let alertType = null;
  let severity  = 'medium';
  let isAnomaly = false;

  if (t.criticalMax !== undefined && value >= t.criticalMax) { alertType = sensor.type === 'temperature' ? 'temp_high' : 'humidity_high'; severity = 'critical'; isAnomaly = true; }
  else if (t.max !== undefined && value >= t.max) { alertType = sensor.type === 'temperature' ? 'temp_high' : 'humidity_high'; severity = 'high'; isAnomaly = true; }
  else if (t.criticalMin !== undefined && value <= t.criticalMin) { alertType = sensor.type === 'temperature' ? 'temp_low' : 'humidity_low'; severity = 'critical'; isAnomaly = true; }
  else if (t.min !== undefined && value <= t.min) { alertType = sensor.type === 'temperature' ? 'temp_low' : 'humidity_low'; severity = 'high'; isAnomaly = true; }

  if (alertType) {
    try {
      const a = await Alert.create({
        type: alertType, severity,
        title: `${sensor.type.charAt(0).toUpperCase() + sensor.type.slice(1)} Alert: ${sensor.name}`,
        message: `Sensor ${sensor.sensorId} reading ${value}${sensor.unit || ''}`,
        details: { sensorId: sensor._id, value, threshold: t },
        warehouseId: sensor.warehouseId,
        entityType: 'Sensor', entityId: sensor._id,
      });
      if (io) io.emit('alert:created', { alert: a });
    } catch { /* non-fatal */ }
  }

  return { isAnomaly, sev: isAnomaly ? (severity === 'critical' ? 'critical' : 'warning') : 'normal' };
}

// ── Admin: register sensor ────────────────────────────────────────────────────
exports.registerSensor = async (req, res) => {
  try {
    const sensor = await Sensor.create(req.body);
    return created(res, sensor, 'Sensor registered');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: list sensors ───────────────────────────────────────────────────────
exports.getSensors = async (req, res) => {
  try {
    const { warehouseId, type, status, zoneId, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (type)        filter.type        = type;
    if (status)      filter.status      = status;
    if (zoneId)      filter.zoneId      = zoneId;
    const total   = await Sensor.countDocuments(filter);
    const sensors = await Sensor.find(filter).sort({ name: 1 }).skip((page-1)*limit).limit(+limit).lean();
    return paginated(res, sensors, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: update sensor ──────────────────────────────────────────────────────
exports.updateSensor = async (req, res) => {
  try {
    const sensor = await Sensor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sensor) return notFound(res, 'Sensor');
    return ok(res, sensor, 'Sensor updated');
  } catch (err) { return serverError(res, err); }
};

// ── Admin / Device: record a reading ─────────────────────────────────────────
exports.recordReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, unit, timestamp } = req.body;
    if (value === undefined) return fail(res, 'value is required');

    const sensor = await Sensor.findById(id);
    if (!sensor) return notFound(res, 'Sensor');

    const io = req.app.locals.io;
    const { isAnomaly, sev } = await checkThresholds(io, sensor, value);

    const reading = await SensorReading.create({
      sensorId: sensor._id,
      warehouseId: sensor.warehouseId,
      value, unit: unit || sensor.unit,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      isAnomaly, severity: sev,
    });

    await Sensor.findByIdAndUpdate(id, {
      lastReading: { value, timestamp: reading.timestamp, isAnomaly },
    });

    if (io) io.emit('sensor:reading', {
      sensorId: sensor._id, sensorType: sensor.type,
      warehouseId: sensor.warehouseId, value, unit: reading.unit,
      isAnomaly, severity: sev, timestamp: reading.timestamp,
    });

    return created(res, reading, 'Reading recorded');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: latest readings for all sensors in warehouse ──────────────────────
exports.getReadings = async (req, res) => {
  try {
    const { warehouseId, sensorId, anomalyOnly, hours = 6, page = 1, limit = 100 } = req.query;
    const since = new Date(Date.now() - hours * 3_600_000);
    const filter = { timestamp: { $gte: since } };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (sensorId)    filter.sensorId    = sensorId;
    if (anomalyOnly === 'true') filter.isAnomaly = true;
    const total    = await SensorReading.countDocuments(filter);
    const readings = await SensorReading.find(filter)
      .sort({ timestamp: -1 }).skip((page-1)*limit).limit(+limit).lean();
    return paginated(res, readings, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: sensor history chart data ─────────────────────────────────────────
exports.getSensorHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 3_600_000);
    const readings = await SensorReading.find({ sensorId: id, timestamp: { $gte: since } })
      .sort({ timestamp: 1 }).limit(1000).lean();
    return ok(res, readings);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: sensors grouped by zone ───────────────────────────────────────────
exports.getSensorsByZone = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const groups = await Sensor.aggregate([
      { $match: { warehouseId: require('mongoose').Types.ObjectId.createFromHexString(warehouseId), isActive: true } },
      { $group: { _id: '$zoneId', sensors: { $push: '$$ROOT' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return ok(res, groups);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: mark sensor as calibrated ─────────────────────────────────────────
exports.calibrateSensor = async (req, res) => {
  try {
    const { calibrationDueAt } = req.body;
    const sensor = await Sensor.findByIdAndUpdate(req.params.id,
      { calibratedAt: new Date(), calibrationDueAt, status: 'active' }, { new: true });
    if (!sensor) return notFound(res, 'Sensor');
    return ok(res, sensor, 'Sensor calibrated');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: sensor stats ───────────────────────────────────────────────────────
exports.getSensorStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;

    const since24h = new Date(Date.now() - 86_400_000);
    const rdFilter = { timestamp: { $gte: since24h } };
    if (warehouseId) rdFilter.warehouseId = warehouseId;

    const [total, active, fault, anomalies24h] = await Promise.all([
      Sensor.countDocuments(filter),
      Sensor.countDocuments({ ...filter, status: 'active' }),
      Sensor.countDocuments({ ...filter, status: 'fault' }),
      SensorReading.countDocuments({ ...rdFilter, isAnomaly: true }),
    ]);

    const byType = await Sensor.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return ok(res, { total, active, fault, anomalies24h, byType });
  } catch (err) { return serverError(res, err); }
};
