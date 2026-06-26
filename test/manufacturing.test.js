'use strict';
/**
 * Sprint 12A — Manufacturing ERP Foundation
 * Tests: Factory, WorkCenter, Machine, Shift, BOM, ProductionOrder, ProductionBatch
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_manufacturing';

beforeAll(async () => { await mongoose.connect(MONGO_URI); });
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key of Object.keys(cols)) { await cols[key].deleteMany({}); }
});

const Factory         = require('../models/Factory');
const WorkCenter      = require('../models/WorkCenter');
const Machine         = require('../models/Machine');
const Shift           = require('../models/Shift');
const BillOfMaterials = require('../models/BillOfMaterials');
const BOMItem         = require('../models/BOMItem');
const ProductionOrder = require('../models/ProductionOrder');
const ProductionBatch = require('../models/ProductionBatch');
const ProductionSettings = require('../models/ProductionSettings');

const productId   = new mongoose.Types.ObjectId();
const rawMatId    = new mongoose.Types.ObjectId();
const warehouseId = new mongoose.Types.ObjectId();

// ── Factory ───────────────────────────────────────────────────────────────────
describe('Factory model', () => {
  beforeAll(async () => { await Factory.createIndexes(); });

  test('creates factory with required fields', async () => {
    const f = await Factory.create({
      name: 'Main Plant', code: 'FAC-001',
      address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    });
    expect(f._id).toBeDefined();
    expect(f.status).toBe('active');
    expect(f.type).toBe('main');
  });

  test('auto-generates code when not provided', async () => {
    const f = await Factory.create({
      name: 'Assembly Plant',
      address: { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    });
    expect(f.code).toMatch(/^FAC-\d{3}$/);
  });

  test('rejects duplicate code', async () => {
    await Factory.create({
      name: 'Plant A', code: 'FAC-DUP',
      address: { city: 'Delhi', state: 'Delhi', pincode: '110001' },
    });
    await expect(Factory.create({
      name: 'Plant B', code: 'FAC-DUP',
      address: { city: 'Delhi', state: 'Delhi', pincode: '110001' },
    })).rejects.toThrow();
  });

  test('status enum validation', async () => {
    await expect(Factory.create({
      name: 'Bad', code: 'FAC-BAD',
      address: { city: 'X', state: 'Y', pincode: '000000' },
      status: 'flying',
    })).rejects.toThrow();
  });

  test('soft delete isDeleted defaults false', async () => {
    const f = await Factory.create({
      name: 'Plant C', code: 'FAC-C',
      address: { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    });
    expect(f.isDeleted).toBe(false);
  });
});

// ── WorkCenter ────────────────────────────────────────────────────────────────
describe('WorkCenter model', () => {
  beforeAll(async () => { await WorkCenter.createIndexes(); });

  let factoryId;
  beforeEach(async () => {
    const f = await Factory.create({
      name: 'Test Factory', code: 'FAC-T01',
      address: { city: 'Mumbai', state: 'MH', pincode: '400001' },
    });
    factoryId = f._id;
  });

  test('creates work center with factory ref', async () => {
    const wc = await WorkCenter.create({ name: 'Assembly A', code: 'WC-0001', factory: factoryId });
    expect(wc._id).toBeDefined();
    expect(wc.type).toBe('assembly');
    expect(wc.status).toBe('active');
  });

  test('rejects duplicate code', async () => {
    await WorkCenter.create({ name: 'WC 1', code: 'WC-DUPE', factory: factoryId });
    await expect(WorkCenter.create({ name: 'WC 2', code: 'WC-DUPE', factory: factoryId })).rejects.toThrow();
  });

  test('type enum accepts all valid values', async () => {
    for (const [i, type] of ['machining', 'assembly', 'quality_check', 'packaging', 'finishing', 'testing', 'other'].entries()) {
      const wc = await WorkCenter.create({ name: `WC ${type}`, code: `WC-${i}T`, factory: factoryId, type });
      expect(wc.type).toBe(type);
    }
  });
});

// ── Machine ───────────────────────────────────────────────────────────────────
describe('Machine model', () => {
  beforeAll(async () => { await Machine.createIndexes(); });

  let factoryId, wcId;
  beforeEach(async () => {
    const f  = await Factory.create({
      name: 'Mach Factory', code: 'FAC-M01',
      address: { city: 'Pune', state: 'MH', pincode: '411001' },
    });
    const wc = await WorkCenter.create({ name: 'WC Main', code: 'WC-M001', factory: f._id });
    factoryId = f._id; wcId = wc._id;
  });

  test('creates machine with required fields', async () => {
    const m = await Machine.create({
      name: 'CNC-001', code: 'MCH-0001', type: 'CNC Lathe',
      workCenter: wcId, factory: factoryId,
    });
    expect(m._id).toBeDefined();
    expect(m.status).toBe('idle');
    expect(m.utilizationRate).toBe(0);
    expect(m.oee).toBe(0);
  });

  test('status enum validation', async () => {
    await expect(Machine.create({
      name: 'Bad', code: 'MCH-BAD', type: 'Lathe',
      workCenter: wcId, factory: factoryId, status: 'flying',
    })).rejects.toThrow();
  });

  test('maintenance logs can be appended', async () => {
    const m = await Machine.create({
      name: 'CNC-002', code: 'MCH-0002', type: 'CNC Lathe',
      workCenter: wcId, factory: factoryId,
    });
    m.maintenanceLogs.push({ type: 'scheduled', description: 'Oil change', performedBy: 'John', cost: 500 });
    await m.save();
    const reloaded = await Machine.findById(m._id);
    expect(reloaded.maintenanceLogs).toHaveLength(1);
    expect(reloaded.maintenanceLogs[0].type).toBe('scheduled');
  });
});

// ── Shift ─────────────────────────────────────────────────────────────────────
describe('Shift model', () => {
  beforeAll(async () => { await Shift.createIndexes(); });

  let factoryId;
  beforeEach(async () => {
    const f = await Factory.create({
      name: 'Shift Factory', code: 'FAC-S01',
      address: { city: 'Delhi', state: 'DL', pincode: '110001' },
    });
    factoryId = f._id;
  });

  test('creates shift with required fields', async () => {
    const s = await Shift.create({
      name: 'Morning Shift', code: 'SHF-001',
      factory: factoryId, startTime: '06:00', endTime: '14:00',
    });
    expect(s._id).toBeDefined();
    expect(s.isActive).toBe(true);
  });

  test('auto-generates code when not provided', async () => {
    const s = await Shift.create({
      name: 'Evening Shift', factory: factoryId,
      startTime: '14:00', endTime: '22:00',
    });
    expect(s.code).toMatch(/^SHF-\d{3}$/);
  });

  test('daysOfWeek enum rejects invalid day', async () => {
    await expect(Shift.create({
      name: 'Bad Shift', code: 'SHF-BAD',
      factory: factoryId, startTime: '06:00', endTime: '14:00',
      daysOfWeek: ['Monday'],
    })).rejects.toThrow();
  });
});

// ── BillOfMaterials ───────────────────────────────────────────────────────────
describe('BillOfMaterials model', () => {
  test('auto-generates BOM number', async () => {
    const bom = await BillOfMaterials.create({ product: productId, productName: 'Table Fan 5 Star' });
    expect(bom.bomNumber).toMatch(/^BOM-\d{4}-\d{5}$/);
    expect(bom.status).toBe('draft');
  });

  test('sequential BOM numbers are unique', async () => {
    const b1 = await BillOfMaterials.create({ product: productId, productName: 'Fan A' });
    const b2 = await BillOfMaterials.create({ product: productId, productName: 'Fan B' });
    expect(b1.bomNumber).not.toBe(b2.bomNumber);
  });

  test('status enum validates correctly', async () => {
    await expect(BillOfMaterials.create({ product: productId, productName: 'X', status: 'approved_maybe' })).rejects.toThrow();
  });

  test('default version is 1.0', async () => {
    const bom = await BillOfMaterials.create({ product: productId, productName: 'Mixer Grinder' });
    expect(bom.version).toBe('1.0');
  });
});

// ── BOMItem ───────────────────────────────────────────────────────────────────
describe('BOMItem model', () => {
  test('creates BOM item with required fields', async () => {
    const bom = await BillOfMaterials.create({ product: productId, productName: 'AC 1.5T' });
    const item = await BOMItem.create({
      bom: bom._id, rawMaterial: rawMatId,
      rawMaterialName: 'Copper Coil', quantity: 2.5, unit: 'kg',
    });
    expect(item._id).toBeDefined();
    expect(item.wasteAllowance).toBe(0);
  });

  test('rejects quantity <= 0', async () => {
    const bom = await BillOfMaterials.create({ product: productId, productName: 'Fridge' });
    await expect(BOMItem.create({
      bom: bom._id, rawMaterial: rawMatId,
      rawMaterialName: 'Steel', quantity: 0, unit: 'kg',
    })).rejects.toThrow();
  });
});

// ── ProductionOrder ───────────────────────────────────────────────────────────
describe('ProductionOrder model', () => {
  let factoryId;
  beforeEach(async () => {
    const f = await Factory.create({
      name: 'Prod Factory', code: 'FAC-P01',
      address: { city: 'Chennai', state: 'TN', pincode: '600001' },
    });
    factoryId = f._id;
  });

  test('auto-generates MFG order number', async () => {
    const o = await ProductionOrder.create({
      product: productId, productName: 'Table Fan', factory: factoryId, plannedQuantity: 100,
    });
    expect(o.orderNumber).toMatch(/^MFG-\d{4}-\d{5}$/);
    expect(o.status).toBe('draft');
    expect(o.priority).toBe('normal');
  });

  test('sequential order numbers are unique', async () => {
    const o1 = await ProductionOrder.create({ product: productId, productName: 'Fan A', factory: factoryId, plannedQuantity: 50 });
    const o2 = await ProductionOrder.create({ product: productId, productName: 'Fan B', factory: factoryId, plannedQuantity: 75 });
    expect(o1.orderNumber).not.toBe(o2.orderNumber);
  });

  test('status enum validates', async () => {
    await expect(ProductionOrder.create({
      product: productId, productName: 'Fan', factory: factoryId, plannedQuantity: 10, status: 'flying',
    })).rejects.toThrow();
  });

  test('completionRate virtual works correctly', async () => {
    const o = await ProductionOrder.create({
      product: productId, productName: 'Fan', factory: factoryId,
      plannedQuantity: 100, completedQuantity: 75,
    });
    expect(o.completionRate).toBe(75);
  });

  test('plannedQuantity must be >= 1', async () => {
    await expect(ProductionOrder.create({
      product: productId, productName: 'Fan', factory: factoryId, plannedQuantity: 0,
    })).rejects.toThrow();
  });

  test('history entries can be pushed', async () => {
    const userId = new mongoose.Types.ObjectId();
    const o = await ProductionOrder.create({
      product: productId, productName: 'Fan', factory: factoryId, plannedQuantity: 50,
    });
    o.history.push({ status: 'draft', note: 'Created', changedBy: userId, changedByName: 'Admin' });
    await o.save();
    const reloaded = await ProductionOrder.findById(o._id);
    expect(reloaded.history).toHaveLength(1);
    expect(reloaded.history[0].status).toBe('draft');
  });
});

// ── ProductionBatch ───────────────────────────────────────────────────────────
describe('ProductionBatch model', () => {
  let orderId;
  beforeEach(async () => {
    const f = await Factory.create({
      name: 'Batch Factory', code: 'FAC-B01',
      address: { city: 'Bengaluru', state: 'KA', pincode: '560001' },
    });
    const o = await ProductionOrder.create({
      product: productId, productName: 'Mixer', factory: f._id, plannedQuantity: 200,
    });
    orderId = o._id;
  });

  test('auto-generates BTH batch number', async () => {
    const b = await ProductionBatch.create({ productionOrder: orderId, product: productId, batchSize: 50 });
    expect(b.batchNumber).toMatch(/^BTH-\d{4}-\d{5}$/);
    expect(b.status).toBe('pending');
  });

  test('sequential batch numbers are unique', async () => {
    const b1 = await ProductionBatch.create({ productionOrder: orderId, product: productId, batchSize: 25 });
    const b2 = await ProductionBatch.create({ productionOrder: orderId, product: productId, batchSize: 30 });
    expect(b1.batchNumber).not.toBe(b2.batchNumber);
  });

  test('scrapRate auto-calculates on save', async () => {
    const b = await ProductionBatch.create({
      productionOrder: orderId, product: productId, batchSize: 100,
      completedQty: 90, rejectedQty: 10,
    });
    expect(b.scrapRate).toBeCloseTo(10, 1);
  });

  test('quality checks can be added', async () => {
    const b = await ProductionBatch.create({ productionOrder: orderId, product: productId, batchSize: 50 });
    b.qualityChecks.push({ parameter: 'Voltage', value: '220V', passed: true, checkedBy: 'QC Team' });
    await b.save();
    const reloaded = await ProductionBatch.findById(b._id);
    expect(reloaded.qualityChecks).toHaveLength(1);
  });
});

// ── ProductionSettings ────────────────────────────────────────────────────────
describe('ProductionSettings model', () => {
  test('getSingleton creates document on first call', async () => {
    const s = await ProductionSettings.getSingleton();
    expect(s._id).toBeDefined();
    expect(s.oeeTarget).toBe(85);
    expect(s.scrapThreshold).toBe(5);
  });

  test('getSingleton returns same document on repeat calls', async () => {
    const s1 = await ProductionSettings.getSingleton();
    const s2 = await ProductionSettings.getSingleton();
    expect(s1._id.toString()).toBe(s2._id.toString());
  });
});
