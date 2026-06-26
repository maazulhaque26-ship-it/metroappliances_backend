/**
 * Sprint 11A — After Sales Service model tests
 * Tests: ServiceRequest auto-ticket, WarrantyCard auto-warrantyNumber,
 *        AMCContract auto-contractNumber, SparePart model, Technician model.
 * Pattern: direct MongoDB connection, no HTTP server (mirrors rfid.test.js).
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_service';

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

// ─── ServiceRequest model ─────────────────────────────────────────────────────
describe('ServiceRequest model', () => {
  let ServiceRequest, User, Product;
  beforeAll(() => {
    ServiceRequest = require('../models/ServiceRequest');
    User = require('../models/User');
    Product = require('../models/Product');
  });

  it('creates a service request with required fields', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sr = await ServiceRequest.create({
      customer: userId,
      category: 'AC Repair',
      description: 'Air conditioner not cooling',
    });
    expect(sr._id).toBeDefined();
    expect(sr.status).toBe('open');
    expect(sr.priority).toBe('medium');
    expect(sr.isDeleted).toBe(false);
  });

  it('auto-generates ticket number on creation', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sr = await ServiceRequest.create({
      customer: userId,
      category: 'Washing Machine',
      description: 'Machine not spinning',
    });
    expect(sr.ticketNumber).toMatch(/^SR-\d{4}-\d{5}$/);
  });

  it('two requests get sequential ticket numbers', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sr1 = await ServiceRequest.create({ customer: userId, category: 'A', description: 'D1' });
    const sr2 = await ServiceRequest.create({ customer: userId, category: 'B', description: 'D2' });
    expect(sr1.ticketNumber).not.toBe(sr2.ticketNumber);
    // Both should match the pattern
    expect(sr1.ticketNumber).toMatch(/^SR-/);
    expect(sr2.ticketNumber).toMatch(/^SR-/);
  });

  it('accepts all valid statuses', async () => {
    const userId = new mongoose.Types.ObjectId();
    const statuses = ['open','verified','warranty_check','assigned','accepted','travelling','reached','diagnosis','repair','testing','awaiting_confirmation','completed','closed','escalated','cancelled','reopened'];
    for (const status of statuses) {
      const sr = await ServiceRequest.create({ customer: userId, category: 'Test', description: 'Test', status });
      expect(sr.status).toBe(status);
    }
  });

  it('rejects invalid status', async () => {
    const userId = new mongoose.Types.ObjectId();
    await expect(ServiceRequest.create({ customer: userId, category: 'X', description: 'X', status: 'flying' })).rejects.toThrow();
  });

  it('stores history entries', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sr = await ServiceRequest.create({
      customer: userId,
      category: 'Fridge',
      description: 'Not cooling',
      history: [{ status: 'open', note: 'Raised by customer', changedAt: new Date() }],
    });
    expect(sr.history).toHaveLength(1);
    expect(sr.history[0].status).toBe('open');
  });

  it('stores comments with isInternal flag', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sr = await ServiceRequest.create({
      customer: userId,
      category: 'TV',
      description: 'No display',
      comments: [
        { text: 'Customer called', authorName: 'Admin', isInternal: true },
        { text: 'Parts ordered', authorName: 'Tech', isInternal: false },
      ],
    });
    expect(sr.comments).toHaveLength(2);
    expect(sr.comments[0].isInternal).toBe(true);
    expect(sr.comments[1].isInternal).toBe(false);
  });

  it('sets SLA default values', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sr = await ServiceRequest.create({ customer: userId, category: 'X', description: 'X' });
    expect(sr.sla.responseHours).toBe(24);
    expect(sr.sla.resolutionHours).toBe(72);
    expect(sr.sla.isBreached).toBe(false);
  });

  it('sets escalation defaults', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sr = await ServiceRequest.create({ customer: userId, category: 'X', description: 'X' });
    expect(sr.escalation.isEscalated).toBe(false);
    expect(sr.escalation.level).toBe(0);
  });
});

// ─── WarrantyCard model ───────────────────────────────────────────────────────
describe('WarrantyCard model', () => {
  let WarrantyCard;
  beforeAll(() => { WarrantyCard = require('../models/WarrantyCard'); });

  it('creates a warranty with required fields', async () => {
    const userId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const wc = await WarrantyCard.create({
      serialNumber: 'SN-TEST-001',
      product: productId,
      customer: userId,
      warrantyType: 'manufacturer',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
    });
    expect(wc._id).toBeDefined();
    expect(wc.status).toBe('pending_activation');
    expect(wc.claimsUsed).toBe(0);
  });

  it('auto-generates warranty number', async () => {
    const wc = await WarrantyCard.create({
      serialNumber: 'SN-002',
      product: new mongoose.Types.ObjectId(),
      customer: new mongoose.Types.ObjectId(),
      warrantyType: 'extended',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
    });
    expect(wc.warrantyNumber).toMatch(/^WC-\d{4}-\d{6}$/);
  });

  it('accepts all valid warranty types', async () => {
    const types = ['manufacturer', 'extended', 'dealer', 'amc'];
    for (const warrantyType of types) {
      const wc = await WarrantyCard.create({
        serialNumber: `SN-TYPE-${warrantyType}`,
        product: new mongoose.Types.ObjectId(),
        customer: new mongoose.Types.ObjectId(),
        warrantyType,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      });
      expect(wc.warrantyType).toBe(warrantyType);
    }
  });

  it('rejects invalid warranty type', async () => {
    await expect(WarrantyCard.create({
      serialNumber: 'BAD-SN',
      product: new mongoose.Types.ObjectId(),
      customer: new mongoose.Types.ObjectId(),
      warrantyType: 'lifetime_cosmic',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
    })).rejects.toThrow();
  });

  it('accepts valid statuses', async () => {
    const statuses = ['active', 'expired', 'void', 'transferred', 'pending_activation'];
    for (const status of statuses) {
      const wc = await WarrantyCard.create({
        serialNumber: `SN-STATUS-${status}`,
        product: new mongoose.Types.ObjectId(),
        customer: new mongoose.Types.ObjectId(),
        warrantyType: 'manufacturer',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status,
      });
      expect(wc.status).toBe(status);
    }
  });

  it('stores transfer history', async () => {
    const fromUser = new mongoose.Types.ObjectId();
    const toUser   = new mongoose.Types.ObjectId();
    const wc = await WarrantyCard.create({
      serialNumber: 'SN-TRANSFER',
      product: new mongoose.Types.ObjectId(),
      customer: fromUser,
      warrantyType: 'manufacturer',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      transferHistory: [{ fromCustomer: fromUser, toCustomer: toUser, transferredAt: new Date() }],
    });
    expect(wc.transferHistory).toHaveLength(1);
    expect(wc.transferHistory[0].fromCustomer.toString()).toBe(fromUser.toString());
  });
});

// ─── AMCContract model ────────────────────────────────────────────────────────
describe('AMCContract model', () => {
  let AMCContract;
  beforeAll(() => { AMCContract = require('../models/AMCContract'); });

  it('creates an AMC contract with required fields', async () => {
    const amc = await AMCContract.create({
      customer: new mongoose.Types.ObjectId(),
      product: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      durationMonths: 12,
      amount: 5000,
    });
    expect(amc._id).toBeDefined();
    expect(amc.status).toBe('pending_activation');
    expect(amc.paymentStatus).toBe('pending');
    expect(amc.completedVisits).toBe(0);
    expect(amc.totalVisits).toBe(2);
  });

  it('auto-generates contract number', async () => {
    const amc = await AMCContract.create({
      customer: new mongoose.Types.ObjectId(),
      product: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      durationMonths: 12,
      amount: 3000,
    });
    expect(amc.contractNumber).toMatch(/^AMC-\d{4}-\d{5}$/);
  });

  it('stores scheduled visits', async () => {
    const techId = new mongoose.Types.ObjectId();
    const amc = await AMCContract.create({
      customer: new mongoose.Types.ObjectId(),
      product: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000),
      durationMonths: 12,
      amount: 4000,
      visits: [
        { scheduledAt: new Date(), technicianId: techId, status: 'scheduled' },
      ],
    });
    expect(amc.visits).toHaveLength(1);
    expect(amc.visits[0].status).toBe('scheduled');
  });
});

// ─── SparePart model ──────────────────────────────────────────────────────────
describe('SparePart model', () => {
  let SparePart;
  beforeAll(async () => {
    SparePart = require('../models/SparePart');
    await SparePart.createIndexes();
  });

  it('creates a spare part with required fields', async () => {
    const part = await SparePart.create({
      partNumber: 'COMP-001',
      name: 'Compressor Unit',
      category: 'AC Parts',
      unitPrice: 3500,
    });
    expect(part._id).toBeDefined();
    expect(part.isActive).toBe(true);
    expect(part.isDeleted).toBe(false);
    expect(part.quantity).toBe(0);
    expect(part.reorderLevel).toBe(5);
    expect(part.taxPercent).toBe(18);
  });

  it('stores part number in uppercase', async () => {
    const part = await SparePart.create({ partNumber: 'fan-motor-001', name: 'Fan Motor', category: 'AC Parts', unitPrice: 800 });
    expect(part.partNumber).toBe('FAN-MOTOR-001');
  });

  it('enforces unique part number constraint', async () => {
    await SparePart.create({ partNumber: 'UNIQUE-001', name: 'Test', category: 'Cat', unitPrice: 100 });
    await expect(SparePart.create({ partNumber: 'UNIQUE-001', name: 'Test2', category: 'Cat', unitPrice: 200 })).rejects.toThrow();
  });

  it('stores consumption logs', async () => {
    const srId = new mongoose.Types.ObjectId();
    const techId = new mongoose.Types.ObjectId();
    const part = await SparePart.create({
      partNumber: 'CONS-001',
      name: 'Capacitor',
      category: 'Electrical',
      unitPrice: 150,
      quantity: 10,
      consumptionLogs: [{ serviceRequestId: srId, technicianId: techId, quantity: 2 }],
    });
    expect(part.consumptionLogs).toHaveLength(1);
    expect(part.consumptionLogs[0].quantity).toBe(2);
  });

  it('does not allow negative quantity', async () => {
    await expect(SparePart.create({ partNumber: 'NEG-001', name: 'Test', category: 'Cat', unitPrice: 100, quantity: -1 })).rejects.toThrow();
  });
});

// ─── Technician model ─────────────────────────────────────────────────────────
describe('Technician model', () => {
  let Technician;
  beforeAll(() => { Technician = require('../models/Technician'); });

  it('creates a technician with required fields', async () => {
    const tech = await Technician.create({
      employeeId: 'EMP-001',
      name: 'Rahul Kumar',
      email: 'rahul@techcorp.com',
      phone: '9876543210',
      password: 'Test@1234',
    });
    expect(tech._id).toBeDefined();
    expect(tech.status).toBe('active');
    expect(tech.currentWorkload).toBe(0);
    expect(tech.maxWorkload).toBe(5);
    expect(tech.rating.average).toBe(0);
    expect(tech.rating.count).toBe(0);
    expect(tech.isDeleted).toBe(false);
    expect(tech.availability.isAvailable).toBe(true);
  });

  it('hashes password on save', async () => {
    const tech = await Technician.create({
      employeeId: 'EMP-002',
      name: 'Test Tech',
      email: 'tech2@test.com',
      phone: '9000000001',
      password: 'PlainPass123',
    });
    const withPass = await Technician.findById(tech._id).select('+password');
    expect(withPass.password).not.toBe('PlainPass123');
    expect(withPass.password.startsWith('$2a$') || withPass.password.startsWith('$2b$')).toBe(true);
  });

  it('matchPassword returns true for correct password', async () => {
    const tech = await Technician.create({
      employeeId: 'EMP-003',
      name: 'Match Test',
      email: 'match@test.com',
      phone: '9000000002',
      password: 'Correct@Pass',
    });
    const found = await Technician.findById(tech._id).select('+password');
    const match = await found.matchPassword('Correct@Pass');
    expect(match).toBe(true);
  });

  it('matchPassword returns false for wrong password', async () => {
    const tech = await Technician.create({
      employeeId: 'EMP-004',
      name: 'Mismatch',
      email: 'mismatch@test.com',
      phone: '9000000003',
      password: 'Original@Pass',
    });
    const found = await Technician.findById(tech._id).select('+password');
    const match = await found.matchPassword('WrongPass!');
    expect(match).toBe(false);
  });

  it('enforces unique employeeId', async () => {
    await Technician.create({ employeeId: 'DUP-001', name: 'A', email: 'a@test.com', phone: '111', password: 'P' });
    await expect(Technician.create({ employeeId: 'DUP-001', name: 'B', email: 'b@test.com', phone: '222', password: 'P' })).rejects.toThrow();
  });

  it('enforces unique email', async () => {
    await Technician.create({ employeeId: 'EMAIL-01', name: 'A', email: 'same@email.com', phone: '333', password: 'P' });
    await expect(Technician.create({ employeeId: 'EMAIL-02', name: 'B', email: 'same@email.com', phone: '444', password: 'P' })).rejects.toThrow();
  });

  it('stores skills array', async () => {
    const tech = await Technician.create({
      employeeId: 'SKILLS-01',
      name: 'Skilled Tech',
      email: 'skilled@test.com',
      phone: '9000001',
      password: 'Pass',
      skills: ['AC Repair', 'Washing Machine', 'Refrigerator'],
    });
    expect(tech.skills).toHaveLength(3);
    expect(tech.skills).toContain('AC Repair');
  });

  it('accepts valid statuses', async () => {
    const statuses = ['active', 'inactive', 'on_leave', 'suspended'];
    for (const status of statuses) {
      const tech = await Technician.create({
        employeeId: `STATUS-${status}`,
        name: status,
        email: `${status}@test.com`,
        phone: `${Math.random()}`,
        password: 'Pass',
        status,
      });
      expect(tech.status).toBe(status);
    }
  });

  it('rejects invalid status', async () => {
    await expect(Technician.create({
      employeeId: 'BAD-STATUS',
      name: 'X',
      email: 'x@test.com',
      phone: '999',
      password: 'P',
      status: 'rogue',
    })).rejects.toThrow();
  });

  it('stores territory config', async () => {
    const tech = await Technician.create({
      employeeId: 'TERR-01',
      name: 'Territory Tech',
      email: 'terr@test.com',
      phone: '9000002',
      password: 'Pass',
      territory: { cities: ['Mumbai', 'Pune'], pincodes: ['400001', '411001'], stateCode: 'MH' },
    });
    expect(tech.territory.cities).toContain('Mumbai');
    expect(tech.territory.pincodes).toContain('400001');
    expect(tech.territory.stateCode).toBe('MH');
  });
});

// ─── dispatch scoring logic ───────────────────────────────────────────────────
describe('Dispatch score logic', () => {
  function scoreTechnician(tech, sr) {
    let score = 0;
    const requiredSkill = sr.category?.toLowerCase();
    if (tech.skills.some(s => s.toLowerCase().includes(requiredSkill))) score += 30;
    const city = sr.serviceAddress?.city;
    if (city && tech.territory.cities.some(c => c.toLowerCase() === city.toLowerCase())) score += 25;
    if (tech.availability.isAvailable) score += 20;
    const workloadRatio = tech.currentWorkload / (tech.maxWorkload || 5);
    score += Math.round((1 - workloadRatio) * 20);
    if (tech.rating.average > 0) score += Math.round(tech.rating.average * 2);
    return score;
  }

  const mockTech = {
    skills: ['AC Repair', 'Washing Machine'],
    territory: { cities: ['Mumbai'] },
    availability: { isAvailable: true },
    currentWorkload: 1,
    maxWorkload: 5,
    rating: { average: 4.5 },
  };

  const mockSR = {
    category: 'AC Repair',
    serviceAddress: { city: 'Mumbai' },
  };

  it('scores technician with full match correctly', () => {
    const score = scoreTechnician(mockTech, mockSR);
    // skill(30) + city(25) + available(20) + workload(16) + rating(9) = 100
    expect(score).toBe(100);
  });

  it('scores lower when city does not match', () => {
    const sr = { ...mockSR, serviceAddress: { city: 'Delhi' } };
    const score = scoreTechnician(mockTech, sr);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(0);
  });

  it('scores lower when skill does not match', () => {
    const sr = { ...mockSR, category: 'Microwave Repair' };
    const score = scoreTechnician(mockTech, sr);
    expect(score).toBeLessThan(100);
  });

  it('unavailable technician scores lower', () => {
    const unavailTech = { ...mockTech, availability: { isAvailable: false } };
    const score = scoreTechnician(unavailTech, mockSR);
    expect(score).toBeLessThan(100);
  });

  it('higher workload = lower score', () => {
    const busyTech = { ...mockTech, currentWorkload: 4 };
    const idleTech = { ...mockTech, currentWorkload: 0 };
    expect(scoreTechnician(idleTech, mockSR)).toBeGreaterThan(scoreTechnician(busyTech, mockSR));
  });
});
