'use strict';
/**
 * Sprint 12D — Enterprise Manufacturing Execution System (MES)
 * Tests: All 22 MES models
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_mes';

beforeAll(async () => { await mongoose.connect(MONGO_URI); });
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key of Object.keys(cols)) { await cols[key].deleteMany({}); }
});

const WorkOrder            = require('../models/WorkOrder');
const WorkOrderOperation   = require('../models/WorkOrderOperation');
const OperationExecution   = require('../models/OperationExecution');
const ProductionExecution  = require('../models/ProductionExecution');
const MachineDowntime      = require('../models/MachineDowntime');
const QualityInspection    = require('../models/QualityInspection');
const QualityCheckpoint    = require('../models/QualityCheckpoint');
const QualityDefect        = require('../models/QualityDefect');
const ProductionScrap      = require('../models/ProductionScrap');
const ProductionRework     = require('../models/ProductionRework');
const ToolManagement       = require('../models/ToolManagement');
const ToolUsage            = require('../models/ToolUsage');
const ToolCalibration      = require('../models/ToolCalibration');
const OperatorShift        = require('../models/OperatorShift');
const OperatorAttendance   = require('../models/OperatorAttendance');
const OperatorSkill        = require('../models/OperatorSkill');
const LaborTracking        = require('../models/LaborTracking');
const MachineRuntime       = require('../models/MachineRuntime');
const OEERecord            = require('../models/OEERecord');
const ProductionEvent      = require('../models/ProductionEvent');
const DowntimeReason       = require('../models/DowntimeReason');
const MaintenanceTrigger   = require('../models/MaintenanceTrigger');

const factoryId    = new mongoose.Types.ObjectId();
const machineId    = new mongoose.Types.ObjectId();
const operatorId   = new mongoose.Types.ObjectId();
const shiftId      = new mongoose.Types.ObjectId();
const workCenterId = new mongoose.Types.ObjectId();

// ─── WorkOrder ────────────────────────────────────────────────────────────────
describe('WorkOrder model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 100, productName: 'Widget A' });
    expect(wo._id).toBeDefined();
    expect(wo.orderNumber).toMatch(/^WO-\d{4}-\d{5}$/);
    expect(wo.status).toBe('draft');
    expect(wo.priority).toBe('normal');
    expect(wo.completedQty).toBe(0);
  });

  test('auto-increments order number sequentially', async () => {
    const w1 = await WorkOrder.create({ factory: factoryId, plannedQty: 10, productName: 'A' });
    const w2 = await WorkOrder.create({ factory: factoryId, plannedQty: 20, productName: 'B' });
    expect(w1.orderNumber).not.toBe(w2.orderNumber);
    expect(w2.orderNumber > w1.orderNumber).toBe(true);
  });

  test('rejects missing factory', async () => {
    await expect(WorkOrder.create({ plannedQty: 10 })).rejects.toThrow();
  });

  test('rejects missing plannedQty', async () => {
    await expect(WorkOrder.create({ factory: factoryId })).rejects.toThrow();
  });

  test('completionRate virtual is 0 on new order', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 100 });
    expect(wo.completionRate).toBe(0);
  });

  test('completionRate virtual calculates correctly', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 100 });
    wo.completedQty = 75;
    expect(wo.completionRate).toBe(75);
  });

  test('soft delete sets isDeleted flag', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    wo.isDeleted = true;
    await wo.save();
    const found = await WorkOrder.findOne({ _id: wo._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ─── WorkOrderOperation ───────────────────────────────────────────────────────
describe('WorkOrderOperation model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 50 });
    const op = await WorkOrderOperation.create({ workOrder: wo._id, operationName: 'Drilling', sequence: 1 });
    expect(op._id).toBeDefined();
    expect(op.status).toBe('pending');
    expect(op.sequence).toBe(1);
  });

  test('rejects missing workOrder', async () => {
    await expect(WorkOrderOperation.create({ operationName: 'Test', sequence: 1 })).rejects.toThrow();
  });

  test('defaults operationType to assembly', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 5 });
    const op = await WorkOrderOperation.create({ workOrder: wo._id, operationName: 'Turn', sequence: 1 });
    expect(op.operationType).toBe('assembly');
  });
});

// ─── OperationExecution ───────────────────────────────────────────────────────
describe('OperationExecution model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 50 });
    const ex = await OperationExecution.create({ workOrder: wo._id, startTime: new Date() });
    expect(ex._id).toBeDefined();
    expect(ex.executionNumber).toMatch(/^OEX-\d{4}-\d{5}$/);
  });

  test('rejects missing workOrder', async () => {
    await expect(OperationExecution.create({ startTime: new Date() })).rejects.toThrow();
  });

  test('rejects missing startTime', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(OperationExecution.create({ workOrder: wo._id })).rejects.toThrow();
  });
});

// ─── ProductionExecution ──────────────────────────────────────────────────────
describe('ProductionExecution model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 50 });
    const ex = await ProductionExecution.create({ workOrder: wo._id, factory: factoryId, startTime: new Date() });
    expect(ex._id).toBeDefined();
    expect(ex.executionNumber).toMatch(/^PEX-\d{4}-\d{5}$/);
    expect(ex.status).toBe('active');
  });

  test('rejects missing factory', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(ProductionExecution.create({ workOrder: wo._id, startTime: new Date() })).rejects.toThrow();
  });
});

// ─── MachineDowntime ──────────────────────────────────────────────────────────
describe('MachineDowntime model', () => {
  test('creates with required fields', async () => {
    const dt = await MachineDowntime.create({ machine: machineId, reason: 'breakdown', startTime: new Date(), category: 'unplanned' });
    expect(dt._id).toBeDefined();
    expect(dt.downtimeNumber).toMatch(/^MDT-\d{4}-\d{5}$/);
    expect(dt.status).toBe('open');
  });

  test('rejects missing machine', async () => {
    await expect(MachineDowntime.create({ reason: 'breakdown', category: 'unplanned' })).rejects.toThrow();
  });

  test('defaults category to unplanned', async () => {
    const dt = await MachineDowntime.create({ machine: machineId, reason: 'breakdown', startTime: new Date() });
    expect(dt.category).toBe('unplanned');
  });
});

// ─── QualityInspection ────────────────────────────────────────────────────────
describe('QualityInspection model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 100 });
    const qi = await QualityInspection.create({ workOrder: wo._id, inspectionType: 'final', inspectedQty: 50 });
    expect(qi._id).toBeDefined();
    expect(qi.inspectionNumber).toMatch(/^QI-\d{4}-\d{5}$/);
    expect(qi.result).toBe('pending');
  });

  test('rejects missing workOrder', async () => {
    await expect(QualityInspection.create({ inspectionType: 'incoming', inspectedQty: 10 })).rejects.toThrow();
  });

  test('rejects invalid result', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(QualityInspection.create({ workOrder: wo._id, inspectionType: 'final', inspectedQty: 5, result: 'maybe' })).rejects.toThrow();
  });
});

// ─── QualityCheckpoint ────────────────────────────────────────────────────────
describe('QualityCheckpoint model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 50 });
    const cp = await QualityCheckpoint.create({ workOrder: wo._id, name: 'Dimension check' });
    expect(cp._id).toBeDefined();
    expect(cp.checkpointNumber).toMatch(/^QCP-\d{4}-\d{5}$/);
    expect(cp.result).toBe('pending');
  });

  test('defaults checkMethod to visual', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    const cp = await QualityCheckpoint.create({ workOrder: wo._id, name: 'Visual check' });
    expect(cp.checkMethod).toBe('visual');
  });
});

// ─── QualityDefect ────────────────────────────────────────────────────────────
describe('QualityDefect model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 50 });
    const d = await QualityDefect.create({ workOrder: wo._id, defectName: 'Scratch', defectCategory: 'surface', severity: 'minor', quantity: 2 });
    expect(d._id).toBeDefined();
    expect(d.defectNumber).toMatch(/^QD-\d{4}-\d{5}$/);
    expect(d.disposition).toBe('pending');
    expect(d.capaRequired).toBe(false);
  });

  test('rejects missing defectName', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(QualityDefect.create({ workOrder: wo._id, defectCategory: 'surface', severity: 'minor' })).rejects.toThrow();
  });
});

// ─── ProductionScrap ──────────────────────────────────────────────────────────
describe('ProductionScrap model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 100 });
    const s = await ProductionScrap.create({ workOrder: wo._id, reason: 'material', quantity: 5 });
    expect(s._id).toBeDefined();
    expect(s.scrapNumber).toMatch(/^SCR-\d{4}-\d{5}$/);
    expect(s.disposition).toBe('pending');
    expect(s.status).toBe('pending');
  });

  test('rejects missing quantity', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(ProductionScrap.create({ workOrder: wo._id })).rejects.toThrow();
  });

  test('scrapNumber prefix is SCR- not PS-', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    const s = await ProductionScrap.create({ workOrder: wo._id, reason: 'material', quantity: 1 });
    expect(s.scrapNumber).toMatch(/^SCR-/);
    expect(s.scrapNumber).not.toMatch(/^PS-/);
  });
});

// ─── ProductionRework ─────────────────────────────────────────────────────────
describe('ProductionRework model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 50 });
    const r = await ProductionRework.create({ workOrder: wo._id, reworkType: 'repair', quantity: 3, reason: 'Surface scratch' });
    expect(r._id).toBeDefined();
    expect(r.reworkNumber).toMatch(/^RWK-\d{4}-\d{5}$/);
    expect(r.status).toBe('pending');
    expect(r.result).toBe('pending');
  });

  test('rejects missing quantity', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(ProductionRework.create({ workOrder: wo._id })).rejects.toThrow();
  });
});

// ─── ToolManagement ───────────────────────────────────────────────────────────
describe('ToolManagement model', () => {
  test('creates with required fields', async () => {
    const t = await ToolManagement.create({ name: 'CNC Drill Bit 6mm', type: 'cutting' });
    expect(t._id).toBeDefined();
    expect(t.toolCode).toMatch(/^TL-\d{4}-\d{4}$/);
    expect(t.status).toBe('available');
    expect(t.currentUsageCycles).toBe(0);
  });

  test('rejects missing name', async () => {
    await expect(ToolManagement.create({ type: 'cutting' })).rejects.toThrow();
  });

  test('rejects invalid type', async () => {
    await expect(ToolManagement.create({ name: 'Test', type: 'invalid_type' })).rejects.toThrow();
  });

  test('sequential toolCodes for two tools', async () => {
    const t1 = await ToolManagement.create({ name: 'Tool A', type: 'measuring' });
    const t2 = await ToolManagement.create({ name: 'Tool B', type: 'measuring' });
    expect(t1.toolCode).not.toBe(t2.toolCode);
  });
});

// ─── ToolUsage ────────────────────────────────────────────────────────────────
describe('ToolUsage model', () => {
  test('creates with required fields', async () => {
    const t = await ToolManagement.create({ name: 'Wrench', type: 'assembly' });
    const u = await ToolUsage.create({ tool: t._id, startTime: new Date() });
    expect(u._id).toBeDefined();
    expect(u.usageNumber).toMatch(/^TU-\d{4}-\d{5}$/);
  });

  test('rejects missing tool', async () => {
    await expect(ToolUsage.create({ startTime: new Date() })).rejects.toThrow();
  });
});

// ─── ToolCalibration ──────────────────────────────────────────────────────────
describe('ToolCalibration model', () => {
  test('creates with required fields', async () => {
    const t = await ToolManagement.create({ name: 'Vernier Caliper', type: 'measuring' });
    const c = await ToolCalibration.create({ tool: t._id, calibrationDate: new Date(), nextCalibrationDate: new Date(Date.now() + 86400000 * 365), result: 'pass' });
    expect(c._id).toBeDefined();
    expect(c.calibrationNumber).toMatch(/^TCAL-\d{4}-\d{5}$/);
  });

  test('rejects missing result', async () => {
    const t = await ToolManagement.create({ name: 'Test Tool', type: 'testing' });
    await expect(ToolCalibration.create({ tool: t._id, calibrationDate: new Date(), nextCalibrationDate: new Date() })).rejects.toThrow();
  });
});

// ─── OperatorShift ────────────────────────────────────────────────────────────
describe('OperatorShift model', () => {
  test('creates with required fields', async () => {
    const s = await OperatorShift.create({ operator: operatorId, shift: shiftId, factory: factoryId, date: new Date() });
    expect(s._id).toBeDefined();
    expect(s.assignmentNumber).toMatch(/^OSH-\d{4}-\d{5}$/);
    expect(s.status).toBe('scheduled');
  });

  test('rejects missing operator', async () => {
    await expect(OperatorShift.create({ shift: shiftId, factory: factoryId, date: new Date() })).rejects.toThrow();
  });

  test('rejects missing factory', async () => {
    await expect(OperatorShift.create({ operator: operatorId, shift: shiftId, date: new Date() })).rejects.toThrow();
  });
});

// ─── OperatorAttendance ───────────────────────────────────────────────────────
describe('OperatorAttendance model', () => {
  test('creates with required fields', async () => {
    const a = await OperatorAttendance.create({ operator: operatorId, factory: factoryId, date: new Date(), status: 'present' });
    expect(a._id).toBeDefined();
    expect(a.attendanceNumber).toMatch(/^OAT-\d{4}-\d{5}$/);
  });

  test('rejects invalid status', async () => {
    await expect(OperatorAttendance.create({ operator: operatorId, factory: factoryId, date: new Date(), status: 'invalid_status' })).rejects.toThrow();
  });
});

// ─── OperatorSkill ────────────────────────────────────────────────────────────
describe('OperatorSkill model', () => {
  test('creates with required fields', async () => {
    const s = await OperatorSkill.create({ operator: operatorId, skillName: 'CNC Machining', proficiencyLevel: 4 });
    expect(s._id).toBeDefined();
    expect(s.isActive).toBe(true);
  });

  test('rejects proficiencyLevel > 5', async () => {
    await expect(OperatorSkill.create({ operator: operatorId, skillName: 'Welding', proficiencyLevel: 6 })).rejects.toThrow();
  });

  test('rejects proficiencyLevel < 1', async () => {
    await expect(OperatorSkill.create({ operator: operatorId, skillName: 'Assembly', proficiencyLevel: 0 })).rejects.toThrow();
  });

  test('has no auto-number field', async () => {
    const s = await OperatorSkill.create({ operator: operatorId, skillName: 'Painting', proficiencyLevel: 3 });
    expect(s.skillNumber).toBeUndefined();
  });
});

// ─── LaborTracking ────────────────────────────────────────────────────────────
describe('LaborTracking model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 100 });
    const l = await LaborTracking.create({ workOrder: wo._id, operator: operatorId, factory: factoryId, date: new Date(), hoursWorked: 8 });
    expect(l._id).toBeDefined();
    expect(l.trackingNumber).toMatch(/^LBR-\d{4}-\d{5}$/);
  });

  test('rejects efficiencyPct > 200', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(LaborTracking.create({ workOrder: wo._id, operator: operatorId, factory: factoryId, date: new Date(), hoursWorked: 8, efficiencyPct: 201 })).rejects.toThrow();
  });

  test('rejects efficiencyPct < 0', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 10 });
    await expect(LaborTracking.create({ workOrder: wo._id, operator: operatorId, factory: factoryId, date: new Date(), hoursWorked: 8, efficiencyPct: -1 })).rejects.toThrow();
  });
});

// ─── MachineRuntime ───────────────────────────────────────────────────────────
describe('MachineRuntime model', () => {
  test('creates with required fields', async () => {
    const r = await MachineRuntime.create({ machine: machineId, date: new Date(), factory: factoryId });
    expect(r._id).toBeDefined();
    expect(r.runtimeNumber).toMatch(/^MRT-\d{4}-\d{5}$/);
  });

  test('rejects missing machine', async () => {
    await expect(MachineRuntime.create({ date: new Date() })).rejects.toThrow();
  });

  test('defaults all time fields to 0', async () => {
    const r = await MachineRuntime.create({ machine: machineId, date: new Date(), factory: factoryId });
    expect(r.runtimeMins).toBe(0);
    expect(r.idleTimeMins).toBe(0);
    expect(r.downtimeMins).toBe(0);
  });
});

// ─── OEERecord ────────────────────────────────────────────────────────────────
describe('OEERecord model', () => {
  test('creates with required fields', async () => {
    const o = await OEERecord.create({ machine: machineId, date: new Date(), availability: 85, performance: 90, quality: 95, oee: 72.7 });
    expect(o._id).toBeDefined();
    expect(o.oeeNumber).toMatch(/^OEE-\d{4}-\d{5}$/);
  });

  test('rejects availability > 100', async () => {
    await expect(OEERecord.create({ machine: machineId, date: new Date(), availability: 101, performance: 90, quality: 95 })).rejects.toThrow();
  });

  test('rejects oee < 0', async () => {
    await expect(OEERecord.create({ machine: machineId, date: new Date(), availability: 85, performance: 90, quality: 95, oee: -1 })).rejects.toThrow();
  });
});

// ─── ProductionEvent ─────────────────────────────────────────────────────────
describe('ProductionEvent model', () => {
  test('creates with required fields', async () => {
    const wo = await WorkOrder.create({ factory: factoryId, plannedQty: 50 });
    const e = await ProductionEvent.create({ eventType: 'work_order_created', workOrder: wo._id, message: 'WO created', severity: 'info' });
    expect(e._id).toBeDefined();
    expect(e.eventNumber).toMatch(/^PEV-\d{4}-\d{5}$/);
    expect(e.severity).toBe('info');
  });

  test('rejects invalid eventType', async () => {
    await expect(ProductionEvent.create({ eventType: 'invalid_event', message: 'test' })).rejects.toThrow();
  });

  test('rejects missing message', async () => {
    await expect(ProductionEvent.create({ eventType: 'work_order_created' })).rejects.toThrow();
  });
});

// ─── DowntimeReason ───────────────────────────────────────────────────────────
describe('DowntimeReason model', () => {
  test('creates with required fields', async () => {
    const d = await DowntimeReason.create({ name: 'Power Failure', category: 'power' });
    expect(d._id).toBeDefined();
    expect(d.code).toMatch(/^DTR-\d{4}$/);
    expect(d.isActive).toBe(true);
  });

  test('code has no year prefix (catalog model)', async () => {
    const d = await DowntimeReason.create({ name: 'Tool Breakage', category: 'tool' });
    expect(d.code).toMatch(/^DTR-\d{4}$/);
    expect(d.code).not.toMatch(/DTR-\d{4}-/);
  });

  test('rejects missing category', async () => {
    await expect(DowntimeReason.create({ name: 'Unknown Issue' })).rejects.toThrow();
  });

  test('increments code sequentially', async () => {
    const d1 = await DowntimeReason.create({ name: 'Reason A', category: 'breakdown' });
    const d2 = await DowntimeReason.create({ name: 'Reason B', category: 'maintenance' });
    expect(d1.code).not.toBe(d2.code);
  });
});

// ─── MaintenanceTrigger ───────────────────────────────────────────────────────
describe('MaintenanceTrigger model', () => {
  test('creates with required fields', async () => {
    const m = await MaintenanceTrigger.create({ machine: machineId, triggerType: 'runtime', triggerName: '500hr Service' });
    expect(m._id).toBeDefined();
    expect(m.triggerNumber).toMatch(/^MTG-\d{4}-\d{5}$/);
    expect(m.status).toBe('active');
    expect(m.priority).toBe('medium');
  });

  test('rejects missing machine', async () => {
    await expect(MaintenanceTrigger.create({ triggerType: 'runtime', triggerName: 'Test' })).rejects.toThrow();
  });

  test('rejects invalid triggerType', async () => {
    await expect(MaintenanceTrigger.create({ machine: machineId, triggerType: 'invalid', triggerName: 'Test' })).rejects.toThrow();
  });

  test('soft delete works', async () => {
    const m = await MaintenanceTrigger.create({ machine: machineId, triggerType: 'date', triggerName: 'Annual service' });
    m.isDeleted = true;
    await m.save();
    const found = await MaintenanceTrigger.findOne({ _id: m._id, isDeleted: false });
    expect(found).toBeNull();
  });
});
