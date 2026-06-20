const mongoose = require('mongoose');
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Inventory model', () => {
  const Inventory = require('../models/Inventory');

  it('creates a valid inventory record', async () => {
    const productId   = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    const inv = await Inventory.create({
      product:      productId,
      warehouse:    warehouseId,
      availableQty: 100,
      safetyStock:  10,
      reorderLevel: 20,
    });

    expect(inv._id).toBeTruthy();
    expect(inv.availableQty).toBe(100);
    expect(inv.reservedQty).toBe(0);
    expect(inv.damagedQty).toBe(0);
    expect(inv.averageCost).toBe(0);
  });

  it('requires product and warehouse', async () => {
    await expect(
      Inventory.create({ availableQty: 10 })
    ).rejects.toThrow();
  });

  it('does not allow negative availableQty', async () => {
    const productId   = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    await expect(
      Inventory.create({ product: productId, warehouse: warehouseId, availableQty: -5 })
    ).rejects.toThrow();
  });
});

describe('GRN model', () => {
  const GRN = require('../models/GRN');

  it('creates a valid GRN in draft status', async () => {
    const warehouseId = new mongoose.Types.ObjectId();

    const grn = await GRN.create({
      grnNumber: 'GRN-20260620-0001',
      warehouse: warehouseId,
      supplier:  'Test Supplier',
      status:    'draft',
      items:     [],
    });

    expect(grn._id).toBeTruthy();
    expect(grn.status).toBe('draft');
    expect(grn.grnNumber).toBe('GRN-20260620-0001');
  });

  it('requires warehouse field', async () => {
    await expect(
      GRN.create({ grnNumber: 'GRN-TEST-0001', status: 'draft' })
    ).rejects.toThrow();
  });

  it('enforces valid status enum', async () => {
    const warehouseId = new mongoose.Types.ObjectId();
    await expect(
      GRN.create({ grnNumber: 'GRN-TEST-0002', warehouse: warehouseId, status: 'invalid_status' })
    ).rejects.toThrow();
  });
});

describe('InventoryTransaction model', () => {
  const InventoryTransaction = require('../models/InventoryTransaction');

  it('creates a valid transaction', async () => {
    const productId   = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    const txn = await InventoryTransaction.create({
      type:      'purchase',
      product:   productId,
      warehouse: warehouseId,
      quantity:  50,
      previousQty: 0,
      newQty:    50,
    });

    expect(txn._id).toBeTruthy();
    expect(txn.type).toBe('purchase');
    expect(txn.quantity).toBe(50);
  });

  it('requires type, product, warehouse, quantity', async () => {
    await expect(
      InventoryTransaction.create({ type: 'purchase', quantity: 10 })
    ).rejects.toThrow();
  });

  it('enforces valid transaction type enum', async () => {
    const productId   = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();
    await expect(
      InventoryTransaction.create({ type: 'invalid_type', product: productId, warehouse: warehouseId, quantity: 10 })
    ).rejects.toThrow();
  });
});

describe('Batch model', () => {
  const Batch = require('../models/Batch');

  it('creates a valid batch', async () => {
    const productId   = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    const batch = await Batch.create({
      batchNumber:  'BATCH-001',
      product:      productId,
      warehouse:    warehouseId,
      initialQty:   200,
      availableQty: 200,
    });

    expect(batch.status).toBe('active');
    expect(batch.availableQty).toBe(200);
  });
});

describe('StockAdjustment model', () => {
  const StockAdjustment = require('../models/StockAdjustment');

  it('creates adjustment in pending status', async () => {
    const warehouseId = new mongoose.Types.ObjectId();

    const adj = await StockAdjustment.create({
      adjustmentNumber: 'ADJ-20260620-0001',
      warehouse:        warehouseId,
      items:            [],
      status:           'pending',
    });

    expect(adj.status).toBe('pending');
    expect(adj._id).toBeTruthy();
  });
});

describe('CycleCount model', () => {
  const CycleCount = require('../models/CycleCount');

  it('creates cycle count in planned status', async () => {
    const warehouseId = new mongoose.Types.ObjectId();

    const cc = await CycleCount.create({
      countNumber:   'CC-20260620-0001',
      warehouse:     warehouseId,
      scheduledDate: new Date(),
      items:         [],
      status:        'planned',
    });

    expect(cc.status).toBe('planned');
    expect(cc.adjustmentGenerated).toBe(false);
  });
});

describe('SerialNumber model', () => {
  const SerialNumber = require('../models/SerialNumber');

  it('creates a serial number in in_stock status', async () => {
    const productId   = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    const sn = await SerialNumber.create({
      serialNumber: 'SN-ABC-001',
      product:      productId,
      warehouse:    warehouseId,
    });

    expect(sn.status).toBe('in_stock');
    expect(sn.serialNumber).toBe('SN-ABC-001');
  });

  it('enforces unique serial numbers', async () => {
    const productId   = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    await SerialNumber.create({ serialNumber: 'SN-DUP-001', product: productId, warehouse: warehouseId });
    await expect(
      SerialNumber.create({ serialNumber: 'SN-DUP-001', product: productId, warehouse: warehouseId })
    ).rejects.toThrow();
  });
});
