'use strict';
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_service11b';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────
const ServiceRequest = require('../models/ServiceRequest');
const WarrantyCard   = require('../models/WarrantyCard');
const AMCContract    = require('../models/AMCContract');
const Notification   = require('../models/Notification');

const userId    = new mongoose.Types.ObjectId();
const productId = new mongoose.Types.ObjectId();

async function createSR(overrides = {}) {
  const sr = new ServiceRequest({
    customer: userId,
    product: productId,
    productName: 'Samsung AC 1.5T',
    serialNumber: 'SN-TEST-001',
    category: 'Air Conditioner',
    description: 'Not cooling',
    priority: 'high',
    serviceAddress: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    ...overrides,
  });
  return sr.save();
}

// ── 1. Service Request Creation (customer flow) ───────────────────────────────
describe('ServiceRequest — Customer Flow', () => {
  test('creates SR with auto ticket number', async () => {
    const sr = await createSR();
    expect(sr.ticketNumber).toMatch(/^SR-\d{4}-\d{5}$/);
    expect(sr.status).toBe('open');
  });

  test('second SR gets incremented ticket number', async () => {
    const sr1 = await createSR();
    const sr2 = await createSR();
    const n1 = parseInt(sr1.ticketNumber.split('-')[2]);
    const n2 = parseInt(sr2.ticketNumber.split('-')[2]);
    expect(n2).toBe(n1 + 1);
  });

  test('SR defaults SLA fields', async () => {
    const sr = await createSR();
    expect(sr.sla.responseHours).toBe(24);
    expect(sr.sla.resolutionHours).toBe(72);
  });

  test('SR with warranty check — can link warranty manually', async () => {
    const warranty = await WarrantyCard.create({
      serialNumber: 'SN-WARRANTY-001',
      product: productId,
      productName: 'LG Fridge',
      customer: userId,
      warrantyType: 'manufacturer',
      startDate: new Date(Date.now() - 10 * 86400000),
      endDate: new Date(Date.now() + 180 * 86400000),
      status: 'active',
    });
    const sr = await createSR({
      serialNumber: 'SN-WARRANTY-001',
      warrantyId: warranty._id,
      isUnderWarranty: true,
    });
    expect(sr.isUnderWarranty).toBe(true);
    expect(sr.warrantyId.toString()).toBe(warranty._id.toString());
  });

  test('SR with AMC — can link AMC manually', async () => {
    const amc = await AMCContract.create({
      customer: userId,
      product: productId,
      productName: 'Whirlpool Washer',
      serialNumber: 'SN-AMC-001',
      startDate: new Date(Date.now() - 5 * 86400000),
      endDate: new Date(Date.now() + 365 * 86400000),
      durationMonths: 12,
      amount: 2999,
      status: 'active',
    });
    const sr = await createSR({
      serialNumber: 'SN-AMC-001',
      amcId: amc._id,
      isUnderAMC: true,
    });
    expect(sr.isUnderAMC).toBe(true);
    expect(sr.amcId.toString()).toBe(amc._id.toString());
  });

  test('attachments can be added to SR', async () => {
    const sr = await createSR();
    sr.attachments.push({ url: 'https://cloudinary.com/test.jpg', type: 'image', uploadedBy: 'customer' });
    await sr.save();
    const reloaded = await ServiceRequest.findById(sr._id);
    expect(reloaded.attachments).toHaveLength(1);
    expect(reloaded.attachments[0].type).toBe('image');
  });

  test('history is pushed on status change', async () => {
    const sr = await createSR();
    sr.history.push({ status: 'open', note: 'Raised', changedBy: userId, changedByModel: 'User', changedAt: new Date() });
    await sr.save();
    expect(sr.history).toHaveLength(1);
    expect(sr.history[0].status).toBe('open');
  });
});

// ── 2. Warranty Validation ────────────────────────────────────────────────────
describe('Warranty Validation', () => {
  test('active warranty within date range — status active', async () => {
    const w = await WarrantyCard.create({
      serialNumber: 'SN-VALID-001',
      product: productId,
      productName: 'Samsung TV',
      customer: userId,
      warrantyType: 'manufacturer',
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 335 * 86400000),
      status: 'active',
    });
    expect(w.status).toBe('active');
    expect(new Date(w.endDate) > new Date()).toBe(true);
  });

  test('expired warranty auto-sets status on save', async () => {
    const w = new WarrantyCard({
      serialNumber: 'SN-EXPIRED-001',
      product: productId,
      productName: 'Old Fridge',
      customer: userId,
      warrantyType: 'manufacturer',
      startDate: new Date(Date.now() - 400 * 86400000),
      endDate: new Date(Date.now() - 30 * 86400000), // already expired
      status: 'active', // set active but end date is past
    });
    await w.save();
    // Pre-save hook should update status to expired
    expect(w.status).toBe('expired');
  });

  test('warranty check by serial returns correct record', async () => {
    await WarrantyCard.create({
      serialNumber: 'SN-SEARCH-001',
      product: productId,
      productName: 'Voltas AC',
      customer: userId,
      warrantyType: 'extended',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      status: 'active',
    });
    const results = await WarrantyCard.find({ serialNumber: 'SN-SEARCH-001', status: 'active', endDate: { $gte: new Date() } });
    expect(results).toHaveLength(1);
    expect(results[0].warrantyType).toBe('extended');
  });

  test('void warranty is not returned in active warranty check', async () => {
    await WarrantyCard.create({
      serialNumber: 'SN-VOID-001',
      product: productId,
      productName: 'Old Device',
      customer: userId,
      warrantyType: 'dealer',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      status: 'void',
    });
    const results = await WarrantyCard.find({ serialNumber: 'SN-VOID-001', status: 'active' });
    expect(results).toHaveLength(0);
  });

  test('warranty number auto-generates WC-YYYY format', async () => {
    const w = await WarrantyCard.create({
      serialNumber: 'SN-NUM-001',
      product: productId,
      productName: 'LG AC',
      customer: userId,
      warrantyType: 'manufacturer',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      status: 'active',
    });
    expect(w.warrantyNumber).toMatch(/^WC-\d{4}-\d{6}$/);
  });
});

// ── 3. AMC Contract ───────────────────────────────────────────────────────────
describe('AMC Contract', () => {
  test('auto-generates contract number in AMC-YYYY format', async () => {
    const amc = await AMCContract.create({
      customer: userId,
      product: productId,
      productName: 'Daikin AC',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      durationMonths: 12,
      amount: 3500,
    });
    expect(amc.contractNumber).toMatch(/^AMC-\d{4}-\d{5}$/);
  });

  test('visit tracking updates completedVisits count', async () => {
    const amc = await AMCContract.create({
      customer: userId,
      product: productId,
      productName: 'Hitachi AC',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      durationMonths: 12,
      amount: 2800,
      totalVisits: 2,
      status: 'active',
    });
    amc.visits.push({ scheduledAt: new Date(), status: 'completed', completedAt: new Date() });
    amc.completedVisits = 1;
    await amc.save();
    const reloaded = await AMCContract.findById(amc._id);
    expect(reloaded.completedVisits).toBe(1);
    expect(reloaded.visits).toHaveLength(1);
  });

  test('AMC defaults: totalVisits=2, status=pending_activation', async () => {
    const amc = await AMCContract.create({
      customer: userId,
      product: productId,
      productName: 'Test AC',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      durationMonths: 12,
      amount: 1500,
    });
    expect(amc.totalVisits).toBe(2);
    expect(amc.status).toBe('pending_activation');
  });
});

// ── 4. Feedback Submission ────────────────────────────────────────────────────
describe('Feedback System', () => {
  test('can submit feedback on completed SR', async () => {
    const sr = await createSR({ status: 'completed' });
    sr.customerRating = 4;
    sr.customerFeedback = 'Good service, quick response';
    sr.status = 'closed';
    sr.closedAt = new Date();
    sr.history.push({ status: 'closed', note: 'Customer rated 4/5', changedBy: userId, changedByModel: 'User', changedAt: new Date() });
    await sr.save();

    const reloaded = await ServiceRequest.findById(sr._id);
    expect(reloaded.customerRating).toBe(4);
    expect(reloaded.customerFeedback).toBe('Good service, quick response');
    expect(reloaded.status).toBe('closed');
  });

  test('rating is validated between 1 and 5', async () => {
    const sr = await createSR({ status: 'completed' });
    sr.customerRating = 6; // invalid
    await expect(sr.save()).rejects.toThrow();
  });

  test('feedback without rating is allowed (rating optional schema-wise)', async () => {
    const sr = await createSR({ status: 'completed' });
    sr.customerFeedback = 'No complaint';
    await sr.save(); // should not throw
    expect(sr.customerFeedback).toBe('No complaint');
  });
});

// ── 5. Notification Model (Sprint 8 reuse) ───────────────────────────────────
describe('Notification (Sprint 8 infrastructure reuse)', () => {
  test('creates user notification with system type', async () => {
    const notif = await Notification.create({
      user: userId,
      type: 'system',
      title: 'Complaint Raised: SR-2026-00001',
      message: 'Your service request has been submitted.',
      link: '/my-service/track/someId',
    });
    expect(notif.type).toBe('system');
    expect(notif.isRead).toBe(false);
    expect(notif.isBroadcast).toBe(false);
  });

  test('notification query for user returns correct results', async () => {
    await Notification.create({ user: userId, type: 'system', title: 'SR Raised', message: 'Test' });
    await Notification.create({ user: userId, type: 'system', title: 'Technician Assigned', message: 'Test 2' });
    const results = await Notification.find({ user: userId });
    expect(results.length).toBe(2);
  });

  test('unread count query works', async () => {
    await Notification.create({ user: userId, type: 'system', title: 'Test 1', message: 'Msg', isRead: false });
    await Notification.create({ user: userId, type: 'system', title: 'Test 2', message: 'Msg', isRead: true });
    const unread = await Notification.countDocuments({ user: userId, isRead: false });
    expect(unread).toBe(1);
  });
});

// ── 6. Attachment Upload (model-level) ───────────────────────────────────────
describe('Attachment Upload Model', () => {
  test('SR can hold multiple attachments with correct types', async () => {
    const sr = await createSR();
    sr.attachments.push(
      { url: 'https://cdn.cloudinary.com/img1.jpg', type: 'image', filename: 'photo.jpg', uploadedBy: 'customer' },
      { url: 'https://cdn.cloudinary.com/inv.pdf', type: 'document', filename: 'invoice.pdf', uploadedBy: 'customer' },
    );
    await sr.save();
    const reloaded = await ServiceRequest.findById(sr._id);
    expect(reloaded.attachments).toHaveLength(2);
    expect(reloaded.attachments[0].type).toBe('image');
    expect(reloaded.attachments[1].type).toBe('document');
  });

  test('technician photos are stored as URL strings', async () => {
    const sr = await createSR();
    sr.technicianPhotos = ['https://cdn.cloudinary.com/before.jpg', 'https://cdn.cloudinary.com/after.jpg'];
    await sr.save();
    const reloaded = await ServiceRequest.findById(sr._id);
    expect(reloaded.technicianPhotos).toHaveLength(2);
  });

  test('customer signature is stored as string (base64 or URL)', async () => {
    const sr = await createSR({ status: 'repair' });
    sr.customerSignature = 'data:image/png;base64,iVBORw0KGgoAAAA==';
    sr.status = 'awaiting_confirmation';
    await sr.save();
    const reloaded = await ServiceRequest.findById(sr._id);
    expect(reloaded.customerSignature).toMatch(/^data:image\/png;base64,/);
    expect(reloaded.status).toBe('awaiting_confirmation');
  });
});

// ── 7. Dashboard Counts ───────────────────────────────────────────────────────
describe('Dashboard Aggregation Counts', () => {
  test('counts tickets by status correctly', async () => {
    await createSR({ status: 'open' });
    await createSR({ status: 'open' });
    await createSR({ status: 'assigned' });
    await createSR({ status: 'completed' });
    await createSR({ status: 'closed' });

    const open = await ServiceRequest.countDocuments({ isDeleted: false, status: 'open' });
    const inProgress = await ServiceRequest.countDocuments({ isDeleted: false, status: { $in: ['assigned','accepted','travelling','reached','diagnosis','repair','testing'] } });
    const completed = await ServiceRequest.countDocuments({ isDeleted: false, status: { $in: ['completed','closed'] } });

    expect(open).toBe(2);
    expect(inProgress).toBe(1);
    expect(completed).toBe(2);
  });

  test('SLA breach count query works', async () => {
    const sr1 = await createSR({ status: 'open' });
    sr1.sla.isBreached = true;
    await sr1.save();
    await createSR({ status: 'open' }); // not breached

    const breached = await ServiceRequest.countDocuments({ isDeleted: false, 'sla.isBreached': true, status: { $nin: ['completed','closed','cancelled'] } });
    expect(breached).toBe(1);
  });

  test('AMC renewal due query works', async () => {
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000);
    await AMCContract.create({
      customer: userId, product: productId, productName: 'AC',
      startDate: new Date(), endDate: new Date(Date.now() + 15 * 86400000),
      durationMonths: 12, amount: 2000, status: 'active',
    });
    await AMCContract.create({
      customer: userId, product: productId, productName: 'Fridge',
      startDate: new Date(), endDate: new Date(Date.now() + 60 * 86400000),
      durationMonths: 12, amount: 2500, status: 'active',
    });

    const renewalDue = await AMCContract.countDocuments({
      isDeleted: false,
      status: { $in: ['active','renewal_due'] },
      endDate: { $lte: thirtyDaysLater },
    });
    expect(renewalDue).toBe(1);
  });
});
