/**
 * Sprint 10D — Enterprise Dispatch & Logistics Engine
 * Tests: Dispatch, Shipment, StockTransfer, DeliveryChallan, Courier model validation
 */
const mongoose = require('mongoose');

const Dispatch      = require('../models/Dispatch');
const Shipment      = require('../models/Shipment');
const StockTransfer = require('../models/StockTransfer');
const DeliveryChallan = require('../models/DeliveryChallan');
const Courier       = require('../models/Courier');
const PickingList   = require('../models/PickingList');
const Package       = require('../models/Package');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_logistics';

beforeAll(async () => { await mongoose.connect(MONGO_URI); });
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
afterEach(async () => { await Promise.all([Dispatch, Shipment, StockTransfer, DeliveryChallan, Courier, PickingList, Package].map(M => M.deleteMany({}))); });

// ── Courier ───────────────────────────────────────────────────────────────────
describe('Courier model', () => {
  const warehouseId = new mongoose.Types.ObjectId();

  test('creates with required fields', async () => {
    const c = await Courier.create({ name: 'BlueDart', code: 'BD' });
    expect(c._id).toBeDefined();
    expect(c.name).toBe('BlueDart');
    expect(c.code).toBe('BD');
    expect(c.status).toBe('active');
  });

  test('rejects duplicate code', async () => {
    await Courier.create({ name: 'DTDC', code: 'DTDC' });
    await expect(Courier.create({ name: 'DTDC2', code: 'DTDC' })).rejects.toThrow();
  });

  test('requires name and code', async () => {
    await expect(Courier.create({ code: 'X' })).rejects.toThrow();
    await expect(Courier.create({ name: 'Y' })).rejects.toThrow();
  });
});

// ── Dispatch ──────────────────────────────────────────────────────────────────
describe('Dispatch model', () => {
  const warehouseId = new mongoose.Types.ObjectId();
  const userId      = new mongoose.Types.ObjectId();

  const baseDispatch = () => ({
    warehouse:     warehouseId,
    warehouseName: 'Main Warehouse',
    recipientName: 'Test Customer',
    recipientPhone:'9999999999',
    deliveryAddress: { city: 'Mumbai', pincode: '400001' },
    items: [{ productName: 'Fan 5 Star', quantity: 2, unit: 'pcs' }],
    createdBy: userId,
  });

  test('auto-generates dispatch number', async () => {
    const d = await Dispatch.create(baseDispatch());
    expect(d.dispatchNumber).toMatch(/^DSP-\d{8}-\d{4}$/);
  });

  test('sequential dispatch numbers are unique', async () => {
    const [d1, d2] = await Promise.all([Dispatch.create(baseDispatch()), Dispatch.create(baseDispatch())]);
    expect(d1.dispatchNumber).not.toBe(d2.dispatchNumber);
  });

  test('default status is pending', async () => {
    const d = await Dispatch.create(baseDispatch());
    expect(d.status).toBe('pending');
  });

  test('default priority is normal', async () => {
    const d = await Dispatch.create(baseDispatch());
    expect(d.priority).toBe('normal');
  });

  test('requires warehouse', async () => {
    const bad = { ...baseDispatch() };
    delete bad.warehouse;
    await expect(Dispatch.create(bad)).rejects.toThrow();
  });

  test('requires recipientName', async () => {
    const bad = { ...baseDispatch() };
    delete bad.recipientName;
    await expect(Dispatch.create(bad)).rejects.toThrow();
  });

  test('isDeleted defaults false', async () => {
    const d = await Dispatch.create(baseDispatch());
    expect(d.isDeleted).toBe(false);
  });

  test('status enum rejects invalid value', async () => {
    const bad = { ...baseDispatch(), status: 'flying' };
    await expect(Dispatch.create(bad)).rejects.toThrow();
  });
});

// ── Shipment ──────────────────────────────────────────────────────────────────
describe('Shipment model', () => {
  const warehouseId = new mongoose.Types.ObjectId();
  const dispatchId  = new mongoose.Types.ObjectId();

  const baseShipment = () => ({
    dispatch:      dispatchId,
    warehouse:     warehouseId,
    recipientName: 'Dealer ABC',
    courierName:   'BlueDart',
    trackingNumber:'BD12345678',
  });

  test('auto-generates shipment number', async () => {
    const s = await Shipment.create(baseShipment());
    expect(s.shipmentNumber).toMatch(/^SHP-\d{8}-\d{4}$/);
  });

  test('default status is created', async () => {
    const s = await Shipment.create(baseShipment());
    expect(s.status).toBe('created');
  });

  test('tracking events array is empty by default', async () => {
    const s = await Shipment.create(baseShipment());
    expect(s.trackingEvents).toHaveLength(0);
  });

  test('rejects invalid status', async () => {
    await expect(Shipment.create({ ...baseShipment(), status: 'flying' })).rejects.toThrow();
  });

  test('two shipments get unique numbers', async () => {
    const [s1, s2] = await Promise.all([Shipment.create(baseShipment()), Shipment.create(baseShipment())]);
    expect(s1.shipmentNumber).not.toBe(s2.shipmentNumber);
  });
});

// ── StockTransfer ─────────────────────────────────────────────────────────────
describe('StockTransfer model', () => {
  const wh1 = new mongoose.Types.ObjectId();
  const wh2 = new mongoose.Types.ObjectId();
  const uid = new mongoose.Types.ObjectId();

  const baseTransfer = () => ({
    fromWarehouse:     wh1,
    fromWarehouseName: 'WH1',
    toWarehouse:       wh2,
    toWarehouseName:   'WH2',
    items:             [{ productName: 'Mixer Grinder', quantityRequested: 10, unit: 'pcs' }],
    requestedBy:       uid,
  });

  test('auto-generates transfer number', async () => {
    const t = await StockTransfer.create(baseTransfer());
    expect(t.transferNumber).toMatch(/^TRF-\d{8}-\d{4}$/);
  });

  test('default status is draft', async () => {
    const t = await StockTransfer.create(baseTransfer());
    expect(t.status).toBe('draft');
  });

  test('requires fromWarehouse and toWarehouse', async () => {
    const bad1 = { ...baseTransfer() }; delete bad1.fromWarehouse;
    const bad2 = { ...baseTransfer() }; delete bad2.toWarehouse;
    await expect(StockTransfer.create(bad1)).rejects.toThrow();
    await expect(StockTransfer.create(bad2)).rejects.toThrow();
  });

  test('item quantityRequired required', async () => {
    const bad = { ...baseTransfer(), items: [{ productName: 'X' }] };
    await expect(StockTransfer.create(bad)).rejects.toThrow();
  });
});

// ── DeliveryChallan ───────────────────────────────────────────────────────────
describe('DeliveryChallan model', () => {
  const uid = new mongoose.Types.ObjectId();

  const baseChallan = () => ({
    consigneeName: 'ABC Dealers',
    consigneeAddress: 'Mumbai',
    supplierName: 'Metro Appliances',
    items: [{ description: 'Table Fan 5 Star', quantity: 5, unit: 'Nos' }],
    createdBy: uid,
  });

  test('auto-generates challan number', async () => {
    const c = await DeliveryChallan.create(baseChallan());
    expect(c.challanNumber).toMatch(/^DC-\d{8}-\d{4}$/);
  });

  test('default status is draft', async () => {
    const c = await DeliveryChallan.create(baseChallan());
    expect(c.status).toBe('draft');
  });

  test('requires consigneeName', async () => {
    const bad = { ...baseChallan() }; delete bad.consigneeName;
    await expect(DeliveryChallan.create(bad)).rejects.toThrow();
  });

  test('auto-numbers items srNo', async () => {
    const c = await DeliveryChallan.create({ ...baseChallan(), items: [
      { description: 'Fan', quantity: 1, unit: 'Nos' },
      { description: 'Mixer', quantity: 2, unit: 'Nos' },
    ]});
    expect(c.items[0].srNo).toBe(1);
    expect(c.items[1].srNo).toBe(2);
  });

  test('purpose defaults to sale', async () => {
    const c = await DeliveryChallan.create(baseChallan());
    expect(c.purpose).toBe('sale');
  });
});

// ── PickingList ───────────────────────────────────────────────────────────────
describe('PickingList model', () => {
  const warehouseId = new mongoose.Types.ObjectId();
  const userId      = new mongoose.Types.ObjectId();

  test('auto-generates picking number', async () => {
    const pl = await PickingList.create({
      warehouse:     warehouseId,
      warehouseName: 'WH Main',
      items:         [{ productName: 'Fan', quantityRequired: 3, status: 'pending' }],
      createdBy:     userId,
    });
    expect(pl.pickingNumber).toMatch(/^PICK-\d{8}-\d{4}$/);
  });

  test('default status is pending', async () => {
    const pl = await PickingList.create({ warehouse: warehouseId, items: [], createdBy: userId });
    expect(pl.status).toBe('pending');
  });
});
