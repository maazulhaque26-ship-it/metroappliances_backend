/**
 * Sensor & Alert model tests — Sprint 10F
 * Tests sensor schema validation, threshold config, reading TTL, alert lifecycle.
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_sensor';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// ─── Threshold check helper (mirrors sensorController logic) ─────────────────
function checkThreshold(value, thresholds) {
  if (!thresholds) return { isAnomaly: false, severity: 'normal' };
  if (thresholds.criticalMax !== undefined && value >= thresholds.criticalMax)
    return { isAnomaly: true, severity: 'critical' };
  if (thresholds.max !== undefined && value >= thresholds.max)
    return { isAnomaly: true, severity: 'warning' };
  if (thresholds.criticalMin !== undefined && value <= thresholds.criticalMin)
    return { isAnomaly: true, severity: 'critical' };
  if (thresholds.min !== undefined && value <= thresholds.min)
    return { isAnomaly: true, severity: 'warning' };
  return { isAnomaly: false, severity: 'normal' };
}

describe('Threshold detection logic', () => {
  const t = { min: 0, max: 25, criticalMin: -5, criticalMax: 35 };

  it('normal reading returns no anomaly', () => {
    expect(checkThreshold(20, t)).toEqual({ isAnomaly: false, severity: 'normal' });
  });
  it('reading at max triggers warning', () => {
    const r = checkThreshold(25, t);
    expect(r.isAnomaly).toBe(true);
    expect(r.severity).toBe('warning');
  });
  it('reading above criticalMax triggers critical', () => {
    const r = checkThreshold(40, t);
    expect(r.isAnomaly).toBe(true);
    expect(r.severity).toBe('critical');
  });
  it('reading at min triggers warning', () => {
    const r = checkThreshold(0, t);
    expect(r.isAnomaly).toBe(true);
    expect(r.severity).toBe('warning');
  });
  it('reading below criticalMin triggers critical', () => {
    const r = checkThreshold(-10, t);
    expect(r.isAnomaly).toBe(true);
    expect(r.severity).toBe('critical');
  });
  it('no thresholds = always normal', () => {
    expect(checkThreshold(999, null)).toEqual({ isAnomaly: false, severity: 'normal' });
  });
});

describe('Sensor model', () => {
  let Sensor;
  beforeAll(() => { Sensor = require('../models/Sensor'); });

  it('creates a sensor with required fields', async () => {
    const wId = new mongoose.Types.ObjectId();
    const sensor = await Sensor.create({
      sensorId: 'TEMP-001',
      name: 'Cold Room Temp',
      type: 'temperature',
      warehouseId: wId,
      unit: '°C',
    });
    expect(sensor._id).toBeDefined();
    expect(sensor.status).toBe('active');
    expect(sensor.isActive).toBe(true);
    expect(sensor.reportingIntervalSeconds).toBe(60);
  });

  it('stores threshold config', async () => {
    const wId = new mongoose.Types.ObjectId();
    const sensor = await Sensor.create({
      sensorId: 'HUM-001',
      name: 'Zone A Humidity',
      type: 'humidity',
      warehouseId: wId,
      unit: '%',
      thresholds: { min: 30, max: 80, criticalMin: 10, criticalMax: 95 },
    });
    expect(sensor.thresholds.min).toBe(30);
    expect(sensor.thresholds.criticalMax).toBe(95);
  });

  it('rejects invalid sensor type', async () => {
    const wId = new mongoose.Types.ObjectId();
    await expect(Sensor.create({
      sensorId: 'BAD-001', name: 'Bad', type: 'quantum_flux', warehouseId: wId,
    })).rejects.toThrow();
  });

  it('allows all valid types', async () => {
    const wId = new mongoose.Types.ObjectId();
    const types = ['temperature', 'humidity', 'weight', 'door', 'motion', 'power', 'battery', 'co2', 'light', 'vibration'];
    for (const type of types) {
      const s = await Sensor.create({ sensorId: `${type.toUpperCase()}-T`, name: type, type, warehouseId: wId });
      expect(s.type).toBe(type);
    }
  });
});

describe('SensorReading model', () => {
  let SensorReading, Sensor;
  beforeAll(() => {
    SensorReading = require('../models/SensorReading');
    Sensor = require('../models/Sensor');
  });

  it('creates a reading with value', async () => {
    const wId = new mongoose.Types.ObjectId();
    const sensor = await Sensor.create({ sensorId: 'RD-S1', name: 'R1', type: 'temperature', warehouseId: wId });
    const reading = await SensorReading.create({
      sensorId: sensor._id,
      warehouseId: wId,
      value: 22.5,
      unit: '°C',
    });
    expect(reading._id).toBeDefined();
    expect(reading.isAnomaly).toBe(false);
    expect(reading.severity).toBe('normal');
  });

  it('has 30-day TTL index declared on timestamp', () => {
    const schema = SensorReading.schema;
    const idx = schema.indexes().find(([fields, opts]) => fields.timestamp === 1 && opts.expireAfterSeconds !== undefined);
    expect(idx).toBeDefined();
    expect(idx[1].expireAfterSeconds).toBe(2_592_000);
  });
});

describe('Alert model', () => {
  let Alert;
  beforeAll(() => { Alert = require('../models/Alert'); });

  it('creates alert with required fields', async () => {
    const alert = await Alert.create({
      type: 'temp_high',
      severity: 'critical',
      title: 'Cold Room Temperature High',
      message: 'Temperature reached 38°C',
    });
    expect(alert._id).toBeDefined();
    expect(alert.status).toBe('active');
    expect(alert.autoResolvable).toBe(false);
  });

  it('rejects invalid alert type', async () => {
    await expect(Alert.create({
      type: 'alien_invasion', severity: 'critical', title: 'T', message: 'M',
    })).rejects.toThrow();
  });

  it('acknowledges an alert', async () => {
    const userId = new mongoose.Types.ObjectId();
    const alert = await Alert.create({ type: 'manual', severity: 'low', title: 'Manual', message: 'Test' });
    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    await alert.save();
    const reloaded = await Alert.findById(alert._id);
    expect(reloaded.status).toBe('acknowledged');
    expect(reloaded.acknowledgedBy.toString()).toBe(userId.toString());
  });

  it('transitions through status lifecycle', async () => {
    const userId = new mongoose.Types.ObjectId();
    const alert = await Alert.create({ type: 'battery_low', severity: 'medium', title: 'Low Batt', message: 'Device at 5%' });
    expect(alert.status).toBe('active');
    alert.status = 'resolved';
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    await alert.save();
    const done = await Alert.findById(alert._id);
    expect(done.status).toBe('resolved');
  });
});

describe('ReplenishmentTask model', () => {
  let ReplenishmentTask;
  beforeAll(() => { ReplenishmentTask = require('../models/ReplenishmentTask'); });

  it('creates a task with required fields', async () => {
    const wId = new mongoose.Types.ObjectId();
    const task = await ReplenishmentTask.create({
      sku: 'SKU-TESTPROD',
      productName: 'Test Product',
      warehouseId: wId,
      recommendedQty: 50,
    });
    expect(task._id).toBeDefined();
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
    expect(task.currentStock).toBe(0);
  });

  it('approves a task', async () => {
    const wId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const task = await ReplenishmentTask.create({ sku: 'APR-001', warehouseId: wId, recommendedQty: 20 });
    task.status = 'approved';
    task.approvedBy = userId;
    task.approvedAt = new Date();
    await task.save();
    const t = await ReplenishmentTask.findById(task._id);
    expect(t.status).toBe('approved');
  });

  it('rejects invalid trigger type', async () => {
    const wId = new mongoose.Types.ObjectId();
    await expect(ReplenishmentTask.create({
      sku: 'BAD-001', warehouseId: wId, recommendedQty: 10, triggerType: 'magic_wand',
    })).rejects.toThrow();
  });
});

describe('VoicePickingSession model', () => {
  let VoicePickingSession;
  beforeAll(() => { VoicePickingSession = require('../models/VoicePickingSession'); });

  it('creates a session', async () => {
    const wId = new mongoose.Types.ObjectId();
    const wUserId = new mongoose.Types.ObjectId();
    const session = await VoicePickingSession.create({
      warehouseUserId: wUserId,
      warehouseId: wId,
      items: [{ sku: 'SKU-001', productName: 'Widget', binCode: 'A-01-01', requiredQty: 5 }],
      totalItems: 1,
    });
    expect(session._id).toBeDefined();
    expect(session.status).toBe('active');
    expect(session.currentItemIndex).toBe(0);
    expect(session.confirmedItems).toBe(0);
  });

  it('records voice logs', async () => {
    const wUserId = new mongoose.Types.ObjectId();
    const session = await VoicePickingSession.create({
      warehouseUserId: wUserId,
      items: [],
      totalItems: 0,
      voiceLogs: [
        { direction: 'system', text: 'Welcome to voice picking', action: 'start', itemIndex: 0 },
        { direction: 'operator', text: 'Confirmed', action: 'confirm', itemIndex: 0 },
      ],
    });
    expect(session.voiceLogs).toHaveLength(2);
    expect(session.voiceLogs[0].direction).toBe('system');
    expect(session.voiceLogs[1].direction).toBe('operator');
  });
});

describe('WarehouseDevice model', () => {
  let WarehouseDevice;
  beforeAll(() => { WarehouseDevice = require('../models/WarehouseDevice'); });

  it('creates a device', async () => {
    const wId = new mongoose.Types.ObjectId();
    const dev = await WarehouseDevice.create({
      deviceId: 'DEV-001',
      name: 'Handheld Scanner 1',
      type: 'barcode_scanner',
      warehouseId: wId,
    });
    expect(dev._id).toBeDefined();
    expect(dev.status).toBe('offline');
    expect(dev.isActive).toBe(true);
  });

  it('rejects invalid device type', async () => {
    const wId = new mongoose.Types.ObjectId();
    await expect(WarehouseDevice.create({
      deviceId: 'BAD-DEV', name: 'Bad', type: 'toaster', warehouseId: wId,
    })).rejects.toThrow();
  });
});

describe('DeviceHealth model', () => {
  let DeviceHealth, WarehouseDevice;
  beforeAll(() => {
    DeviceHealth = require('../models/DeviceHealth');
    WarehouseDevice = require('../models/WarehouseDevice');
  });

  it('creates health record', async () => {
    const wId = new mongoose.Types.ObjectId();
    const dev = await WarehouseDevice.create({ deviceId: 'HLTH-001', name: 'Test', type: 'tablet', warehouseId: wId });
    const health = await DeviceHealth.create({
      deviceId: dev._id,
      batteryLevel: 85,
      signalStrength: 72,
      isOnline: true,
    });
    expect(health._id).toBeDefined();
    expect(health.batteryLevel).toBe(85);
    expect(health.isOnline).toBe(true);
  });

  it('has 7-day TTL index on timestamp', () => {
    const schema = DeviceHealth.schema;
    const idx = schema.indexes().find(([fields, opts]) => fields.timestamp === 1 && opts.expireAfterSeconds !== undefined);
    expect(idx).toBeDefined();
    expect(idx[1].expireAfterSeconds).toBe(604_800);
  });
});
