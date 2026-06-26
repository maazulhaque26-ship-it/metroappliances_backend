/**
 * AuditLog model tests — Sprint 9F
 * Run: npx jest test/auditLog.test.js
 */
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_audit';

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

describe('AuditLog model', () => {
  it('creates a valid audit log entry', async () => {
    const userId = new mongoose.Types.ObjectId();
    const log = await AuditLog.create({
      admin:     userId,
      adminName: 'Test Admin',
      adminEmail:'admin@metro.com',
      adminRole: 'admin',
      action:    'DEALER_APPROVED',
      entity:    'Dealer',
      entityId:  new mongoose.Types.ObjectId(),
      entityLabel: 'Mehta Appliances',
      ip:        '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(log._id).toBeDefined();
    expect(log.action).toBe('DEALER_APPROVED');
    expect(log.entity).toBe('Dealer');
    expect(log.adminName).toBe('Test Admin');
  });

  it('requires admin field', async () => {
    await expect(AuditLog.create({ action: 'TEST', entity: 'Test' })).rejects.toThrow();
  });

  it('requires action field', async () => {
    await expect(AuditLog.create({ admin: new mongoose.Types.ObjectId(), entity: 'Test' })).rejects.toThrow();
  });
});
