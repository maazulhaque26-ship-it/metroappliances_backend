'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_eam';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

// ── Helper to clear model registry between tests ──────────────────────────────
function loadModel(path) {
  // Clear cached model if it exists to avoid OverwriteModelError
  const name = require(path).modelName;
  try { return mongoose.model(name); } catch { return require(path); }
}

// ── 1. Asset ──────────────────────────────────────────────────────────────────
describe('Asset', () => {
  const Asset = require('../models/Asset');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Compressor A', assetType: 'machinery' });
    expect(a.assetNumber.startsWith('AST-')).toBeTruthy();
    expect(a.isDeleted).toBe(false);
  });
  it('auto-generates assetNumber', async () => {
    const a = await Asset.create({ name: 'Pump B', assetType: 'machinery' });
    expect(a.assetNumber).toMatch(/^AST-\d{4}-\d{5}$/);
  });
  it('rejects missing required fields', async () => {
    await expect(Asset.create({ name: 'X' })).rejects.toThrow(/assetType/);
  });
});

// ── 2. AssetCategory ──────────────────────────────────────────────────────────
describe('AssetCategory', () => {
  const AssetCategory = require('../models/AssetCategory');
  it('creates with required fields', async () => {
    const c = await AssetCategory.create({ name: 'Pumps' });
    expect(c.code.startsWith('AC-')).toBeTruthy();
    expect(c.isDeleted).toBe(false);
  });
  it('auto-generates code', async () => {
    const c = await AssetCategory.create({ name: 'Compressors' });
    expect(c.code).toMatch(/^AC-\d{4}$/);
  });
  it('rejects missing name', async () => {
    await expect(AssetCategory.create({})).rejects.toThrow(/name/);
  });
});

// ── 3. AssetLocation ─────────────────────────────────────────────────────────
describe('AssetLocation', () => {
  const AssetLocation = require('../models/AssetLocation');
  it('creates with required fields', async () => {
    const l = await AssetLocation.create({ name: 'Shop Floor A' });
    expect(l.code.startsWith('LOC-')).toBeTruthy();
    expect(l.isDeleted).toBe(false);
  });
  it('auto-generates code', async () => {
    const l = await AssetLocation.create({ name: 'Utility Room' });
    expect(l.code).toMatch(/^LOC-\d{4}$/);
  });
  it('rejects missing name', async () => {
    await expect(AssetLocation.create({})).rejects.toThrow(/name/);
  });
});

// ── 4. AssetHierarchy ────────────────────────────────────────────────────────
describe('AssetHierarchy', () => {
  const Asset = require('../models/Asset');
  const AssetHierarchy = require('../models/AssetHierarchy');
  it('creates with asset ref', async () => {
    const a = await Asset.create({ name: 'Motor', assetType: 'machinery' });
    const h = await AssetHierarchy.create({ asset: a._id, path: 'PLANT-01.FLOOR-A.MOTOR-01' });
    expect(h.asset.toString()).toBe(a._id.toString());
  });
  it('stores path string', async () => {
    const a = await Asset.create({ name: 'Conveyor', assetType: 'machinery' });
    const h = await AssetHierarchy.create({ asset: a._id, path: 'PLANT.LINE1.CONV-01' });
    expect(h.path).toBe('PLANT.LINE1.CONV-01');
  });
  it('rejects missing asset', async () => {
    await expect(AssetHierarchy.create({ path: 'X' })).rejects.toThrow(/asset/);
  });
});

// ── 5. MaintenancePlan ───────────────────────────────────────────────────────
describe('MaintenancePlan', () => {
  const MaintenancePlan = require('../models/MaintenancePlan');
  it('creates with required fields', async () => {
    const mp = await MaintenancePlan.create({ name: 'Monthly PM', maintenanceType: 'preventive', recurrenceType: 'monthly' });
    expect(mp.planNumber.startsWith('MP-')).toBeTruthy();
    expect(mp.isDeleted).toBe(false);
  });
  it('auto-generates planNumber', async () => {
    const mp = await MaintenancePlan.create({ name: 'Weekly PM', maintenanceType: 'preventive', recurrenceType: 'weekly' });
    expect(mp.planNumber).toMatch(/^MP-\d{4}-\d{5}$/);
  });
  it('rejects missing name', async () => {
    await expect(MaintenancePlan.create({ maintenanceType: 'preventive', recurrenceType: 'monthly' })).rejects.toThrow(/name/);
  });
});

// ── 6. MaintenanceSchedule ───────────────────────────────────────────────────
describe('MaintenanceSchedule', () => {
  const Asset = require('../models/Asset');
  const MaintenancePlan = require('../models/MaintenancePlan');
  const MaintenanceSchedule = require('../models/MaintenanceSchedule');
  it('creates with required fields', async () => {
    const a  = await Asset.create({ name: 'Boiler', assetType: 'machinery' });
    const mp = await MaintenancePlan.create({ name: 'Boiler PM', maintenanceType: 'preventive', recurrenceType: 'monthly' });
    const s  = await MaintenanceSchedule.create({ maintenancePlan: mp._id, asset: a._id, scheduledDate: new Date(), dueDate: new Date(Date.now() + 7*86400000) });
    expect(s.scheduleNumber.startsWith('MS-')).toBeTruthy();
  });
  it('auto-generates scheduleNumber', async () => {
    const a  = await Asset.create({ name: 'Tank', assetType: 'machinery' });
    const mp = await MaintenancePlan.create({ name: 'Tank PM', maintenanceType: 'preventive', recurrenceType: 'weekly' });
    const s  = await MaintenanceSchedule.create({ maintenancePlan: mp._id, asset: a._id, scheduledDate: new Date(), dueDate: new Date(Date.now() + 7*86400000) });
    expect(s.scheduleNumber).toMatch(/^MS-\d{4}-\d{5}$/);
  });
  it('rejects missing asset', async () => {
    await expect(MaintenanceSchedule.create({ scheduledDate: new Date(), dueDate: new Date() })).rejects.toThrow(/asset/);
  });
});

// ── 7. MaintenanceWorkOrder ──────────────────────────────────────────────────
describe('MaintenanceWorkOrder', () => {
  const Asset = require('../models/Asset');
  const MaintenanceWorkOrder = require('../models/MaintenanceWorkOrder');
  it('creates with required fields', async () => {
    const a  = await Asset.create({ name: 'Crane', assetType: 'machinery' });
    const wo = await MaintenanceWorkOrder.create({ title: 'Crane Inspection', asset: a._id, maintenanceType: 'preventive' });
    expect(wo.workOrderNumber.startsWith('MWO-')).toBeTruthy();
    expect(wo.status).toBe('draft');
  });
  it('auto-generates workOrderNumber', async () => {
    const a  = await Asset.create({ name: 'Lathe', assetType: 'machinery' });
    const wo = await MaintenanceWorkOrder.create({ title: 'Lathe PM', asset: a._id, maintenanceType: 'corrective' });
    expect(wo.workOrderNumber).toMatch(/^MWO-\d{4}-\d{5}$/);
  });
  it('rejects missing title', async () => {
    await expect(MaintenanceWorkOrder.create({ maintenanceType: 'preventive' })).rejects.toThrow(/title/);
  });
});

// ── 8. MaintenanceTask ───────────────────────────────────────────────────────
describe('MaintenanceTask', () => {
  const Asset = require('../models/Asset');
  const MaintenanceWorkOrder = require('../models/MaintenanceWorkOrder');
  const MaintenanceTask = require('../models/MaintenanceTask');
  it('creates with required fields', async () => {
    const a  = await Asset.create({ name: 'Drill', assetType: 'machinery' });
    const wo = await MaintenanceWorkOrder.create({ title: 'Drill PM', asset: a._id, maintenanceType: 'preventive' });
    const t  = await MaintenanceTask.create({ maintenanceWorkOrder: wo._id, taskName: 'Check belts', taskType: 'inspection' });
    expect(t.taskName).toBe('Check belts');
  });
  it('defaults status to pending', async () => {
    const a  = await Asset.create({ name: 'Grinder', assetType: 'machinery' });
    const wo = await MaintenanceWorkOrder.create({ title: 'Grinder PM', asset: a._id, maintenanceType: 'preventive' });
    const t  = await MaintenanceTask.create({ maintenanceWorkOrder: wo._id, taskName: 'Lubricate bearings', taskType: 'lubrication' });
    expect(t.status).toBe('pending');
  });
  it('rejects missing taskName', async () => {
    await expect(MaintenanceTask.create({ taskType: 'inspection' })).rejects.toThrow(/maintenanceWorkOrder|taskName/);
  });
});

// ── 9. MaintenanceChecklist ──────────────────────────────────────────────────
describe('MaintenanceChecklist', () => {
  const MaintenanceChecklist = require('../models/MaintenanceChecklist');
  it('creates with required fields', async () => {
    const cl = await MaintenanceChecklist.create({ name: 'Pre-Start Checklist', maintenanceType: 'preventive' });
    expect(cl.checklistNumber.startsWith('MCL-')).toBeTruthy();
  });
  it('supports template flag', async () => {
    const cl = await MaintenanceChecklist.create({ name: 'PM Template', maintenanceType: 'preventive', isTemplate: true });
    expect(cl.isTemplate).toBe(true);
  });
  it('rejects missing name', async () => {
    await expect(MaintenanceChecklist.create({})).rejects.toThrow(/name/);
  });
});

// ── 10. MaintenanceHistory ───────────────────────────────────────────────────
describe('MaintenanceHistory', () => {
  const Asset = require('../models/Asset');
  const MaintenanceHistory = require('../models/MaintenanceHistory');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Press', assetType: 'machinery' });
    const h = await MaintenanceHistory.create({ asset: a._id, maintenanceType: 'preventive', performedDate: new Date() });
    expect(h.isDeleted).toBe(false);
  });
  it('stores result enum', async () => {
    const a = await Asset.create({ name: 'Welder', assetType: 'machinery' });
    const h = await MaintenanceHistory.create({ asset: a._id, maintenanceType: 'corrective', performedDate: new Date(), result: 'successful' });
    expect(h.result).toBe('successful');
  });
  it('rejects missing asset', async () => {
    await expect(MaintenanceHistory.create({ maintenanceType: 'preventive', performedDate: new Date() })).rejects.toThrow(/asset/);
  });
});

// ── 11. MaintenanceRequest ───────────────────────────────────────────────────
describe('MaintenanceRequest', () => {
  const Asset = require('../models/Asset');
  const MaintenanceRequest = require('../models/MaintenanceRequest');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Fan', assetType: 'machinery' });
    const r = await MaintenanceRequest.create({ title: 'Fan noise', description: 'Unusual noise', asset: a._id });
    expect(r.requestNumber.startsWith('MR-')).toBeTruthy();
    expect(r.status).toBe('open');
  });
  it('auto-generates requestNumber', async () => {
    const a = await Asset.create({ name: 'Blower', assetType: 'machinery' });
    const r = await MaintenanceRequest.create({ title: 'Blower vibration', description: 'High vibration', asset: a._id });
    expect(r.requestNumber).toMatch(/^MR-\d{4}-\d{5}$/);
  });
  it('rejects missing title', async () => {
    await expect(MaintenanceRequest.create({ description: 'desc' })).rejects.toThrow(/title|asset/);
  });
});

// ── 12. BreakdownRecord ──────────────────────────────────────────────────────
describe('BreakdownRecord', () => {
  const Asset = require('../models/Asset');
  const BreakdownRecord = require('../models/BreakdownRecord');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'CNC', assetType: 'machinery' });
    const b = await BreakdownRecord.create({ asset: a._id, breakdownDate: new Date(), failureMode: 'mechanical', severity: 'critical' });
    expect(b.breakdownNumber.startsWith('BRK-')).toBeTruthy();
    expect(b.status).toBe('open');
  });
  it('auto-generates breakdownNumber', async () => {
    const a = await Asset.create({ name: 'VMC', assetType: 'machinery' });
    const b = await BreakdownRecord.create({ asset: a._id, breakdownDate: new Date(), failureMode: 'electrical', severity: 'major' });
    expect(b.breakdownNumber).toMatch(/^BRK-\d{4}-\d{5}$/);
  });
  it('rejects missing failureMode', async () => {
    const a = await Asset.create({ name: 'HMC', assetType: 'machinery' });
    await expect(BreakdownRecord.create({ asset: a._id, breakdownDate: new Date(), severity: 'high' })).rejects.toThrow(/failureMode/);
  });
});

// ── 13. PreventiveMaintenance ────────────────────────────────────────────────
describe('PreventiveMaintenance', () => {
  const Asset = require('../models/Asset');
  const MaintenancePlan = require('../models/MaintenancePlan');
  const PreventiveMaintenance = require('../models/PreventiveMaintenance');
  it('creates with required fields', async () => {
    const a  = await Asset.create({ name: 'Turbine', assetType: 'machinery' });
    const mp = await MaintenancePlan.create({ name: 'Turbine PM', maintenanceType: 'preventive', recurrenceType: 'monthly' });
    const pm = await PreventiveMaintenance.create({ maintenancePlan: mp._id, asset: a._id, scheduledDate: new Date() });
    expect(pm.pmNumber.startsWith('PM-')).toBeTruthy();
    expect(pm.status).toBe('scheduled');
  });
  it('auto-generates pmNumber', async () => {
    const a  = await Asset.create({ name: 'Generator', assetType: 'machinery' });
    const mp = await MaintenancePlan.create({ name: 'Gen PM', maintenanceType: 'preventive', recurrenceType: 'quarterly' });
    const pm = await PreventiveMaintenance.create({ maintenancePlan: mp._id, asset: a._id, scheduledDate: new Date() });
    expect(pm.pmNumber).toMatch(/^PM-\d{4}-\d{5}$/);
  });
  it('rejects missing scheduledDate', async () => {
    const a  = await Asset.create({ name: 'AHU', assetType: 'machinery' });
    const mp = await MaintenancePlan.create({ name: 'AHU PM', maintenanceType: 'preventive', recurrenceType: 'monthly' });
    await expect(PreventiveMaintenance.create({ maintenancePlan: mp._id, asset: a._id })).rejects.toThrow(/scheduledDate/);
  });
});

// ── 14. PredictiveMaintenance ─────────────────────────────────────────────────
describe('PredictiveMaintenance', () => {
  const Asset = require('../models/Asset');
  const PredictiveMaintenance = require('../models/PredictiveMaintenance');
  it('creates with required fields', async () => {
    const a    = await Asset.create({ name: 'Chiller', assetType: 'machinery' });
    const pred = await PredictiveMaintenance.create({ asset: a._id });
    expect(pred.predNumber.startsWith('PRED-')).toBeTruthy();
    expect(pred.trend).toBe('stable');
  });
  it('auto-generates predNumber', async () => {
    const a    = await Asset.create({ name: 'Cooling Tower', assetType: 'machinery' });
    const pred = await PredictiveMaintenance.create({ asset: a._id });
    expect(pred.predNumber).toMatch(/^PRED-\d{4}-\d{5}$/);
  });
  it('rejects missing asset', async () => {
    await expect(PredictiveMaintenance.create({})).rejects.toThrow(/asset/);
  });
});

// ── 15. ConditionMonitoring ──────────────────────────────────────────────────
describe('ConditionMonitoring', () => {
  const Asset = require('../models/Asset');
  const ConditionMonitoring = require('../models/ConditionMonitoring');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Motor XY', assetType: 'machinery' });
    const m = await ConditionMonitoring.create({ asset: a._id, parameter: 'Bearing Temp', parameterType: 'temperature' });
    expect(m.monitorNumber.startsWith('CM-')).toBeTruthy();
    expect(m.currentState).toBe('unknown');
  });
  it('auto-generates monitorNumber', async () => {
    const a = await Asset.create({ name: 'Pump XY', assetType: 'machinery' });
    const m = await ConditionMonitoring.create({ asset: a._id, parameter: 'Inlet Pressure', parameterType: 'pressure' });
    expect(m.monitorNumber).toMatch(/^CM-\d{4}-\d{5}$/);
  });
  it('rejects missing parameter', async () => {
    const a = await Asset.create({ name: 'Valve', assetType: 'machinery' });
    await expect(ConditionMonitoring.create({ asset: a._id, parameterType: 'temperature' })).rejects.toThrow(/parameter/);
  });
});

// ── 16. MaintenanceContract ──────────────────────────────────────────────────
describe('MaintenanceContract', () => {
  const MaintenanceContract = require('../models/MaintenanceContract');
  it('creates with required fields', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const c = await MaintenanceContract.create({ title: 'AMC 2026', contractType: 'amc', vendor: vendorId, startDate: new Date(), endDate: new Date(Date.now() + 365*86400000) });
    expect(c.contractNumber.startsWith('MC-')).toBeTruthy();
    expect(c.status).toBe('draft');
  });
  it('auto-generates contractNumber', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const c = await MaintenanceContract.create({ title: 'PM Contract', contractType: 'comprehensive', vendor: vendorId, startDate: new Date(), endDate: new Date(Date.now() + 365*86400000) });
    expect(c.contractNumber).toMatch(/^MC-\d{4}-\d{5}$/);
  });
  it('rejects missing title', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    await expect(MaintenanceContract.create({ contractType: 'amc', vendor: vendorId, startDate: new Date(), endDate: new Date() })).rejects.toThrow(/title/);
  });
});

// ── 17. AssetDocument ────────────────────────────────────────────────────────
describe('AssetDocument', () => {
  const Asset = require('../models/Asset');
  const AssetDocument = require('../models/AssetDocument');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Reactor', assetType: 'machinery' });
    const d = await AssetDocument.create({ asset: a._id, documentType: 'manual', title: 'Operation Manual' });
    expect(d.title).toBe('Operation Manual');
    expect(d.isDeleted).toBe(false);
  });
  it('rejects missing title', async () => {
    const a = await Asset.create({ name: 'Mixer', assetType: 'machinery' });
    await expect(AssetDocument.create({ asset: a._id, documentType: 'manual' })).rejects.toThrow(/title/);
  });
  it('rejects missing documentType', async () => {
    const a = await Asset.create({ name: 'Stirrer', assetType: 'machinery' });
    await expect(AssetDocument.create({ asset: a._id, title: 'Manual' })).rejects.toThrow(/documentType/);
  });
});

// ── 18. AssetMeter ───────────────────────────────────────────────────────────
describe('AssetMeter', () => {
  const Asset = require('../models/Asset');
  const AssetMeter = require('../models/AssetMeter');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Spindle', assetType: 'machinery' });
    const m = await AssetMeter.create({ asset: a._id, name: 'Runtime Hours', meterType: 'runtime_hours', unit: 'hours' });
    expect(m.meterNumber.startsWith('MTR-')).toBeTruthy();
    expect(m.isActive).toBe(true);
  });
  it('auto-generates meterNumber', async () => {
    const a = await Asset.create({ name: 'Axis Z', assetType: 'machinery' });
    const m = await AssetMeter.create({ asset: a._id, name: 'Cycle Count', meterType: 'cycles', unit: 'cycles' });
    expect(m.meterNumber).toMatch(/^MTR-\d{4}-\d{5}$/);
  });
  it('rejects missing name', async () => {
    const a = await Asset.create({ name: 'Tool', assetType: 'machinery' });
    await expect(AssetMeter.create({ asset: a._id, meterType: 'runtime_hours', unit: 'hours' })).rejects.toThrow(/name/);
  });
});

// ── 19. MeterReading ─────────────────────────────────────────────────────────
describe('MeterReading', () => {
  const Asset = require('../models/Asset');
  const AssetMeter = require('../models/AssetMeter');
  const MeterReading = require('../models/MeterReading');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Drill Press', assetType: 'machinery' });
    const m = await AssetMeter.create({ asset: a._id, name: 'Hours', meterType: 'runtime_hours', unit: 'hours' });
    const r = await MeterReading.create({ assetMeter: m._id, asset: a._id, readingValue: 1500, readingDate: new Date() });
    expect(r.readingValue).toBe(1500);
    expect(r.isThresholdBreached).toBe(false);
  });
  it('rejects missing readingValue', async () => {
    const a = await Asset.create({ name: 'Band Saw', assetType: 'machinery' });
    const m = await AssetMeter.create({ asset: a._id, name: 'Cuts', meterType: 'cycles', unit: 'cuts' });
    await expect(MeterReading.create({ assetMeter: m._id, asset: a._id, readingDate: new Date() })).rejects.toThrow(/readingValue/);
  });
  it('rejects missing assetMeter', async () => {
    const a = await Asset.create({ name: 'Jigsaw', assetType: 'machinery' });
    await expect(MeterReading.create({ asset: a._id, readingValue: 100, readingDate: new Date() })).rejects.toThrow(/assetMeter/);
  });
});

// ── 20. AssetDepreciation ────────────────────────────────────────────────────
describe('AssetDepreciation', () => {
  const Asset = require('../models/Asset');
  const AssetDepreciation = require('../models/AssetDepreciation');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Hydraulic Press', assetType: 'machinery' });
    const d = await AssetDepreciation.create({ asset: a._id, depreciationMethod: 'straight_line', purchaseCost: 500000, usefulLifeYears: 10 });
    expect(d.depreciationMethod).toBe('straight_line');
    expect(d.isDeleted).toBe(false);
  });
  it('rejects invalid method', async () => {
    const a = await Asset.create({ name: 'Shear', assetType: 'machinery' });
    await expect(AssetDepreciation.create({ asset: a._id, depreciationMethod: 'invalid', purchaseCost: 100000, usefulLifeYears: 5 })).rejects.toThrow(/depreciationMethod/);
  });
  it('rejects missing purchaseCost', async () => {
    const a = await Asset.create({ name: 'Punch', assetType: 'machinery' });
    await expect(AssetDepreciation.create({ asset: a._id, depreciationMethod: 'straight_line', usefulLifeYears: 5 })).rejects.toThrow(/purchaseCost/);
  });
});

// ── 21. AssetWarranty ────────────────────────────────────────────────────────
describe('AssetWarranty', () => {
  const Asset = require('../models/Asset');
  const AssetWarranty = require('../models/AssetWarranty');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'AC Unit', assetType: 'machinery' });
    const w = await AssetWarranty.create({ asset: a._id, warrantyType: 'manufacturer', startDate: new Date(), endDate: new Date(Date.now() + 365*86400000) });
    expect(w.warrantyNumber.startsWith('AW-')).toBeTruthy();
    expect(w.status).toBe('active');
  });
  it('auto-generates warrantyNumber', async () => {
    const a = await Asset.create({ name: 'UPS', assetType: 'machinery' });
    const w = await AssetWarranty.create({ asset: a._id, warrantyType: 'extended', startDate: new Date(), endDate: new Date(Date.now() + 365*86400000) });
    expect(w.warrantyNumber).toMatch(/^AW-\d{4}-\d{5}$/);
  });
  it('rejects missing endDate', async () => {
    const a = await Asset.create({ name: 'Switchgear', assetType: 'machinery' });
    await expect(AssetWarranty.create({ asset: a._id, warrantyType: 'manufacturer', startDate: new Date() })).rejects.toThrow(/endDate/);
  });
});

// ── 22. AssetCalibration ─────────────────────────────────────────────────────
describe('AssetCalibration', () => {
  const Asset = require('../models/Asset');
  const AssetCalibration = require('../models/AssetCalibration');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Pressure Gauge', assetType: 'equipment' });
    const c = await AssetCalibration.create({ asset: a._id, calibrationDate: new Date(), overallResult: 'pass' });
    expect(c.calibrationNumber.startsWith('ACL-')).toBeTruthy();
    expect(c.overallResult).toBe('pass');
  });
  it('auto-generates calibrationNumber', async () => {
    const a = await Asset.create({ name: 'Thermometer', assetType: 'equipment' });
    const c = await AssetCalibration.create({ asset: a._id, calibrationDate: new Date(), overallResult: 'pass' });
    expect(c.calibrationNumber).toMatch(/^ACL-\d{4}-\d{5}$/);
  });
  it('rejects missing calibrationDate', async () => {
    const a = await Asset.create({ name: 'Flow Meter', assetType: 'equipment' });
    await expect(AssetCalibration.create({ asset: a._id, overallResult: 'pass' })).rejects.toThrow(/calibrationDate/);
  });
});

// ── 23. AssetRiskAssessment ──────────────────────────────────────────────────
describe('AssetRiskAssessment', () => {
  const Asset = require('../models/Asset');
  const AssetRiskAssessment = require('../models/AssetRiskAssessment');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Steam Boiler', assetType: 'machinery' });
    const r = await AssetRiskAssessment.create({ asset: a._id, assessmentDate: new Date() });
    expect(r.assessmentNumber.startsWith('ARA-')).toBeTruthy();
    expect(r.overallRisk).toBe('low');
  });
  it('auto-generates assessmentNumber', async () => {
    const a = await Asset.create({ name: 'Autoclave', assetType: 'machinery' });
    const r = await AssetRiskAssessment.create({ asset: a._id, assessmentDate: new Date() });
    expect(r.assessmentNumber).toMatch(/^ARA-\d{4}-\d{5}$/);
  });
  it('rejects missing assessmentDate', async () => {
    const a = await Asset.create({ name: 'Kiln', assetType: 'machinery' });
    await expect(AssetRiskAssessment.create({ asset: a._id })).rejects.toThrow(/assessmentDate/);
  });
});

// ── 24. AssetFailureAnalysis ─────────────────────────────────────────────────
describe('AssetFailureAnalysis', () => {
  const Asset = require('../models/Asset');
  const AssetFailureAnalysis = require('../models/AssetFailureAnalysis');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Centrifuge', assetType: 'machinery' });
    const f = await AssetFailureAnalysis.create({ asset: a._id, analysisDate: new Date(), analysisMethod: 'fmea', failureDescription: 'Bearing failure' });
    expect(f.analysisNumber.startsWith('AFA-')).toBeTruthy();
    expect(f.status).toBe('draft');
  });
  it('auto-generates analysisNumber', async () => {
    const a = await Asset.create({ name: 'Extruder', assetType: 'machinery' });
    const f = await AssetFailureAnalysis.create({ asset: a._id, analysisDate: new Date(), analysisMethod: '5why', failureDescription: 'Shaft crack' });
    expect(f.analysisNumber).toMatch(/^AFA-\d{4}-\d{5}$/);
  });
  it('rejects missing analysisMethod', async () => {
    const a = await Asset.create({ name: 'Injector', assetType: 'machinery' });
    await expect(AssetFailureAnalysis.create({ asset: a._id, analysisDate: new Date(), failureDescription: 'Leak' })).rejects.toThrow(/analysisMethod/);
  });
});

// ── 25. AssetLifecycle ───────────────────────────────────────────────────────
describe('AssetLifecycle', () => {
  const Asset = require('../models/Asset');
  const AssetLifecycle = require('../models/AssetLifecycle');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Robot Arm', assetType: 'machinery' });
    const e = await AssetLifecycle.create({ asset: a._id, eventType: 'commissioned', eventDate: new Date() });
    expect(e.eventType).toBe('commissioned');
    expect(e.isDeleted).toBe(false);
  });
  it('rejects invalid eventType', async () => {
    const a = await Asset.create({ name: 'Conveyor Belt', assetType: 'machinery' });
    await expect(AssetLifecycle.create({ asset: a._id, eventType: 'invalid', eventDate: new Date() })).rejects.toThrow(/eventType/);
  });
  it('rejects missing eventDate', async () => {
    const a = await Asset.create({ name: 'Palletizer', assetType: 'machinery' });
    await expect(AssetLifecycle.create({ asset: a._id, eventType: 'commissioned' })).rejects.toThrow(/eventDate/);
  });
});

// ── 26. MaintenanceInventory ─────────────────────────────────────────────────
describe('MaintenanceInventory', () => {
  const Asset = require('../models/Asset');
  const MaintenanceWorkOrder = require('../models/MaintenanceWorkOrder');
  const MaintenanceInventory = require('../models/MaintenanceInventory');
  it('creates with required fields', async () => {
    const a  = await Asset.create({ name: 'Lathe 2', assetType: 'machinery' });
    const wo = await MaintenanceWorkOrder.create({ title: 'Lathe repair', asset: a._id, maintenanceType: 'corrective' });
    const mi = await MaintenanceInventory.create({ maintenanceWorkOrder: wo._id, transactionType: 'issue', partName: 'Bearing 6205', quantity: 2 });
    expect(mi.transactionNumber.startsWith('MIT-')).toBeTruthy();
    expect(mi.quantity).toBe(2);
  });
  it('auto-generates transactionNumber', async () => {
    const a  = await Asset.create({ name: 'Mill', assetType: 'machinery' });
    const wo = await MaintenanceWorkOrder.create({ title: 'Mill PM', asset: a._id, maintenanceType: 'preventive' });
    const mi = await MaintenanceInventory.create({ maintenanceWorkOrder: wo._id, transactionType: 'consumption', partName: 'Oil Filter', quantity: 1 });
    expect(mi.transactionNumber).toMatch(/^MIT-\d{4}-\d{5}$/);
  });
  it('rejects missing partName', async () => {
    const a  = await Asset.create({ name: 'Router', assetType: 'machinery' });
    const wo = await MaintenanceWorkOrder.create({ title: 'Router repair', asset: a._id, maintenanceType: 'corrective' });
    await expect(MaintenanceInventory.create({ maintenanceWorkOrder: wo._id, transactionType: 'issue', quantity: 1 })).rejects.toThrow(/partName/);
  });
});

// ── 27. MaintenancePlanner ───────────────────────────────────────────────────
describe('MaintenancePlanner', () => {
  const MaintenancePlanner = require('../models/MaintenancePlanner');
  it('creates with required fields', async () => {
    const p = await MaintenancePlanner.create({ name: 'June 2026 Plan', plannerType: 'monthly', startDate: new Date(), endDate: new Date(Date.now() + 30*86400000) });
    expect(p.plannerNumber.startsWith('MPLR-')).toBeTruthy();
    expect(p.status).toBe('draft');
  });
  it('auto-generates plannerNumber', async () => {
    const p = await MaintenancePlanner.create({ name: 'Q3 2026 Plan', plannerType: 'quarterly', startDate: new Date(), endDate: new Date(Date.now() + 90*86400000) });
    expect(p.plannerNumber).toMatch(/^MPLR-\d{4}-\d{4}$/);
  });
  it('rejects missing name', async () => {
    await expect(MaintenancePlanner.create({ plannerType: 'weekly', startDate: new Date(), endDate: new Date() })).rejects.toThrow(/name/);
  });
});

// ── 28. VendorMaintenance ────────────────────────────────────────────────────
describe('VendorMaintenance', () => {
  const Asset = require('../models/Asset');
  const VendorMaintenance = require('../models/VendorMaintenance');
  it('creates with required fields', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const a = await Asset.create({ name: 'HVAC Unit', assetType: 'machinery' });
    const v = await VendorMaintenance.create({ vendor: vendorId, asset: a._id, serviceType: 'amc_service', serviceDate: new Date() });
    expect(v.serviceNumber.startsWith('VMS-')).toBeTruthy();
    expect(v.status).toBe('scheduled');
  });
  it('auto-generates serviceNumber', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const a = await Asset.create({ name: 'Chiller Unit', assetType: 'machinery' });
    const v = await VendorMaintenance.create({ vendor: vendorId, asset: a._id, serviceType: 'repair', serviceDate: new Date() });
    expect(v.serviceNumber).toMatch(/^VMS-\d{4}-\d{5}$/);
  });
  it('rejects missing serviceType', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const a = await Asset.create({ name: 'AHU 2', assetType: 'machinery' });
    await expect(VendorMaintenance.create({ vendor: vendorId, asset: a._id, serviceDate: new Date() })).rejects.toThrow(/serviceType/);
  });
});

// ── 29. MaintenanceLog ───────────────────────────────────────────────────────
describe('MaintenanceLog', () => {
  const Asset = require('../models/Asset');
  const MaintenanceLog = require('../models/MaintenanceLog');
  it('creates with required fields', async () => {
    const a = await Asset.create({ name: 'Air Compressor', assetType: 'machinery' });
    const l = await MaintenanceLog.create({ asset: a._id, logType: 'preventive', maintenanceDate: new Date(), description: 'Monthly PM completed' });
    expect(l.logNumber.startsWith('ML-')).toBeTruthy();
    expect(l.result).toBe('successful');
  });
  it('auto-generates logNumber', async () => {
    const a = await Asset.create({ name: 'Air Dryer', assetType: 'machinery' });
    const l = await MaintenanceLog.create({ asset: a._id, logType: 'lubrication', maintenanceDate: new Date(), description: 'Lubricated bearings' });
    expect(l.logNumber).toMatch(/^ML-\d{4}-\d{5}$/);
  });
  it('rejects missing description', async () => {
    const a = await Asset.create({ name: 'Filter Unit', assetType: 'machinery' });
    await expect(MaintenanceLog.create({ asset: a._id, logType: 'preventive', maintenanceDate: new Date() })).rejects.toThrow(/description/);
  });
});
