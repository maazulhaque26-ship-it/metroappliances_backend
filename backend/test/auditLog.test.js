/**
 * AuditLog model tests — Sprint 9F
 * Run: npx jest test/auditLog.test.js
 */
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

// Requires setup.js wiring in jest.config.js

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
