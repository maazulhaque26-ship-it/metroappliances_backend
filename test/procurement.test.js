/**
 * Sprint 10C — Procurement Model Unit Tests
 * Run: cd backend && npx jest test/procurement.test.js --forceExit
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// ── Vendor ────────────────────────────────────────────────────────────────────
describe('Vendor model', () => {
  let Vendor;
  beforeAll(() => { Vendor = require('../models/Vendor'); });

  test('requires companyName', async () => {
    const v = new Vendor({ vendorType: 'manufacturer' });
    await expect(v.validate()).rejects.toThrow(/companyName/);
  });

  test('auto-generates vendorCode on save', async () => {
    const v = new Vendor({ companyName: 'TEST_Vendor_AutoCode', vendorType: 'manufacturer', email: `test-${Date.now()}@example.com` });
    await v.save();
    expect(v.vendorCode).toMatch(/^VND-\d{6}-\d{4}$/);
    await Vendor.findByIdAndDelete(v._id);
  });

  test('defaults status to pending_approval', async () => {
    const v = new Vendor({ companyName: 'TEST_Vendor_Status', vendorType: 'trader', email: `t2-${Date.now()}@example.com` });
    expect(v.status).toBe('pending_approval');
    await Vendor.findByIdAndDelete(v._id).catch(() => {});
  });

  test('rejects invalid email', async () => {
    const v = new Vendor({ companyName: 'TEST_Vendor_Email', email: 'not-an-email' });
    await expect(v.validate()).rejects.toThrow(/email/i);
  });
});

// ── PurchaseRequisition ───────────────────────────────────────────────────────
describe('PurchaseRequisition model', () => {
  let PR, User;
  let fakeUserId;

  beforeAll(() => {
    PR   = require('../models/PurchaseRequisition');
    fakeUserId = new mongoose.Types.ObjectId();
  });

  test('requires title', async () => {
    const pr = new PR({ requestedBy: fakeUserId });
    await expect(pr.validate()).rejects.toThrow(/title/);
  });

  test('requires requestedBy', async () => {
    const pr = new PR({ title: 'TEST_PR_NoUser' });
    await expect(pr.validate()).rejects.toThrow(/requestedBy/);
  });

  test('defaults status to draft', async () => {
    const pr = new PR({ title: 'TEST_PR_Status', requestedBy: fakeUserId });
    expect(pr.status).toBe('draft');
  });

  test('creates PR with items and builds approval chain', async () => {
    const pr = new PR({
      title: 'TEST_PR_Full',
      requestedBy: fakeUserId,
      requestedByName: 'Test User',
      department: 'Procurement',
      items: [{ productName: 'Widget A', quantity: 10, unit: 'pcs', estimatedUnitCost: 500 }],
      priority: 'medium',
    });
    await pr.save();
    expect(pr.prNumber).toMatch(/^PR-\d{8}-\d{4}$/);
    // approval chain should have 3 steps (purchase_manager, finance, admin)
    expect(pr.approvalSteps.length).toBe(3);
    expect(pr.approvalSteps[0].role).toBe('purchase_manager');
    expect(pr.approvalSteps[2].role).toBe('admin');
    await PR.findByIdAndDelete(pr._id);
  });
});

// ── RFQ ───────────────────────────────────────────────────────────────────────
describe('RFQ model', () => {
  let RFQ;
  let fakeUserId;

  beforeAll(() => {
    RFQ = require('../models/RFQ');
    fakeUserId = new mongoose.Types.ObjectId();
  });

  test('requires title', async () => {
    const rfq = new RFQ({ createdBy: fakeUserId });
    await expect(rfq.validate()).rejects.toThrow(/title/);
  });

  test('requires createdBy', async () => {
    const rfq = new RFQ({ title: 'TEST_RFQ_NoUser' });
    await expect(rfq.validate()).rejects.toThrow(/createdBy/);
  });

  test('defaults status to draft', async () => {
    const rfq = new RFQ({ title: 'TEST_RFQ_Status', createdBy: fakeUserId });
    expect(rfq.status).toBe('draft');
  });

  test('auto-generates rfqNumber on save', async () => {
    const rfq = new RFQ({
      title: 'TEST_RFQ_AutoNumber',
      createdBy: fakeUserId,
      createdByName: 'Admin',
      submissionDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      items: [{ productName: 'Bolt M8', quantity: 500, unit: 'pcs' }],
    });
    await rfq.save();
    expect(rfq.rfqNumber).toMatch(/^RFQ-\d{8}-\d{4}$/);
    await RFQ.findByIdAndDelete(rfq._id);
  });
});

// ── PurchaseOrder ─────────────────────────────────────────────────────────────
describe('PurchaseOrder model', () => {
  let PO, Vendor;
  let fakeUserId, fakeVendorId;

  beforeAll(async () => {
    PO     = require('../models/PurchaseOrder');
    Vendor = require('../models/Vendor');
    fakeUserId   = new mongoose.Types.ObjectId();
    fakeVendorId = new mongoose.Types.ObjectId();
  });

  test('requires vendor', async () => {
    const po = new PO({ createdBy: fakeUserId, notes: 'test-procurement-suite' });
    await expect(po.validate()).rejects.toThrow(/vendor/);
  });

  test('requires createdBy', async () => {
    const po = new PO({ vendor: fakeVendorId, notes: 'test-procurement-suite' });
    await expect(po.validate()).rejects.toThrow(/createdBy/);
  });

  test('defaults status to draft', () => {
    const po = new PO({ vendor: fakeVendorId, createdBy: fakeUserId });
    expect(po.status).toBe('draft');
  });

  test('saves PO and auto-generates poNumber', async () => {
    const po = new PO({
      vendor: fakeVendorId,
      createdBy: fakeUserId,
      createdByName: 'Admin',
      vendorName: 'Test Vendor Co',
      notes: 'test-procurement-suite',
      items: [{
        productName: 'Screw M4',
        quantity: 100, unit: 'pcs',
        unitPrice: 5,
        taxRate: 18,
        taxAmount: 90,
        totalAmount: 590,
      }],
      subtotal: 500,
      taxAmount: 90,
      totalAmount: 590,
    });
    await po.save();
    expect(po.poNumber).toMatch(/^PO-\d{8}-\d{4}$/);
    // approval chain should be built
    expect(po.approvalSteps.length).toBe(3);
    await PO.findByIdAndDelete(po._id);
  });
});
