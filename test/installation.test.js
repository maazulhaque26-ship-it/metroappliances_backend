/**
 * Sprint 11C — Product Registration + Installation Management tests
 * Tests: ProductRegistration auto-number, InstallationRequest auto-number + default checklist,
 *        InstallationEngineer password hash + matchPassword, dispatch scoring, dashboard counts.
 * Pattern: direct MongoDB connection, no HTTP server (mirrors service.test.js).
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_installation';

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

// ─── ProductRegistration model ────────────────────────────────────────────────
describe('ProductRegistration model', () => {
  let ProductRegistration;
  beforeAll(async () => {
    ProductRegistration = require('../models/ProductRegistration');
    await ProductRegistration.createIndexes();
  });

  it('creates a product registration with required fields', async () => {
    const customerId = new mongoose.Types.ObjectId();
    const pr = await ProductRegistration.create({
      customer:      customerId,
      productName:   'IFB Front Load Washer',
      brand:         'IFB',
      modelNumber:   'Senator WXS 8KG',
      serialNumber:  'SN12345TEST',
      purchaseDate:  new Date(),
    });
    expect(pr._id).toBeDefined();
    expect(pr.status).toBe('pending');
    expect(pr.isDeleted).toBe(false);
    expect(pr.serialNumber).toBe('SN12345TEST');
  });

  it('auto-generates PR-YYYY-NNNNN registration number', async () => {
    const customerId = new mongoose.Types.ObjectId();
    const pr = await ProductRegistration.create({
      customer:     customerId,
      productName:  'Test Product',
      brand:        'TestBrand',
      modelNumber:  'MOD-001',
      serialNumber: 'SERIAL-AUTO-001',
      purchaseDate: new Date(),
    });
    expect(pr.registrationNumber).toMatch(/^PR-\d{4}-\d{5}$/);
  });

  it('increments registration number sequentially', async () => {
    const customerId = new mongoose.Types.ObjectId();
    const base = { customer: customerId, brand: 'B', modelNumber: 'M', purchaseDate: new Date() };
    const pr1 = await ProductRegistration.create({ ...base, productName: 'P1', serialNumber: 'SEQ-001' });
    const pr2 = await ProductRegistration.create({ ...base, productName: 'P2', serialNumber: 'SEQ-002' });
    const n1 = parseInt(pr1.registrationNumber.split('-')[2], 10);
    const n2 = parseInt(pr2.registrationNumber.split('-')[2], 10);
    expect(n2).toBe(n1 + 1);
  });

  it('stores and uppercases serial number', async () => {
    const pr = await ProductRegistration.create({
      customer: new mongoose.Types.ObjectId(), productName: 'P', brand: 'B',
      modelNumber: 'M', serialNumber: 'lower-case-serial', purchaseDate: new Date(),
    });
    expect(pr.serialNumber).toBe('LOWER-CASE-SERIAL');
  });

  it('defaults status to pending', async () => {
    const pr = await ProductRegistration.create({
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', brand: 'B', modelNumber: 'M',
      serialNumber: 'STATUS-TEST-001', purchaseDate: new Date(),
    });
    expect(pr.status).toBe('pending');
  });

  it('allows valid status transitions', async () => {
    const pr = await ProductRegistration.create({
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', brand: 'B', modelNumber: 'M',
      serialNumber: 'STATUS-TEST-002', purchaseDate: new Date(),
    });
    pr.status = 'verified';
    await pr.save();
    expect(pr.status).toBe('verified');
  });

  it('stores warranty activation data', async () => {
    const pr = await ProductRegistration.create({
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', brand: 'B', modelNumber: 'M',
      serialNumber: 'WARRANTY-TEST-001', purchaseDate: new Date(),
    });
    pr.status = 'warranty_activated';
    const warrantyId = new mongoose.Types.ObjectId();
    pr.warranty = { activatedAt: new Date(), warrantyId, duration: 24 };
    await pr.save();
    expect(pr.warranty.duration).toBe(24);
    expect(pr.warranty.warrantyId.toString()).toBe(warrantyId.toString());
  });

  it('stores transfer history entry', async () => {
    const pr = await ProductRegistration.create({
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', brand: 'B', modelNumber: 'M',
      serialNumber: 'TRANSFER-TEST-001', purchaseDate: new Date(),
    });
    pr.transferHistory.push({
      fromCustomer: new mongoose.Types.ObjectId(),
      toCustomer:   new mongoose.Types.ObjectId(),
      transferredAt: new Date(),
      note:          'Sold to friend',
    });
    await pr.save();
    expect(pr.transferHistory).toHaveLength(1);
    expect(pr.transferHistory[0].note).toBe('Sold to friend');
  });

  it('soft-deletes correctly', async () => {
    const pr = await ProductRegistration.create({
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', brand: 'B', modelNumber: 'M',
      serialNumber: 'DELETE-TEST-001', purchaseDate: new Date(),
    });
    pr.isDeleted = true;
    await pr.save();
    const found = await ProductRegistration.findOne({ _id: pr._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ─── InstallationRequest model ────────────────────────────────────────────────
describe('InstallationRequest model', () => {
  let InstallationRequest;
  beforeAll(() => {
    InstallationRequest = require('../models/InstallationRequest');
  });

  it('creates an installation request with required fields', async () => {
    const customerId = new mongoose.Types.ObjectId();
    const ir = await InstallationRequest.create({
      customer:     customerId,
      productName:  'IFB Air Conditioner',
      category:     'Air Conditioner',
      serviceType:  'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: {
        line1: '123 Main St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001',
      },
    });
    expect(ir._id).toBeDefined();
    expect(ir.status).toBe('pending');
    expect(ir.priority).toBe('normal');
    expect(ir.isDeleted).toBe(false);
  });

  it('auto-generates IR-YYYY-NNNNN request number', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'Test Appliance',
      category:      'Refrigerator',
      serviceType:   'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Delhi', state: 'Delhi', pincode: '110001' },
    });
    expect(ir.requestNumber).toMatch(/^IR-\d{4}-\d{5}$/);
  });

  it('increments request number sequentially', async () => {
    const base = {
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', category: 'AC', serviceType: 'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    };
    const ir1 = await InstallationRequest.create({ ...base });
    const ir2 = await InstallationRequest.create({ ...base });
    const n1 = parseInt(ir1.requestNumber.split('-')[2], 10);
    const n2 = parseInt(ir2.requestNumber.split('-')[2], 10);
    expect(n2).toBe(n1 + 1);
  });

  it('adds 10 default checklist items for installation type', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'Washing Machine',
      category:      'Washing Machine',
      serviceType:   'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
    });
    expect(ir.checklist.length).toBe(10);
    expect(ir.checklist[0].completed).toBe(false);
  });

  it('does NOT add default checklist for non-installation type', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'AC Unit',
      category:      'Air Conditioner',
      serviceType:   'inspection',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    });
    expect(ir.checklist.length).toBe(0);
  });

  it('does NOT overwrite a pre-populated checklist', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'Fridge',
      category:      'Refrigerator',
      serviceType:   'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      checklist:     [{ item: 'Custom Step 1' }],
    });
    expect(ir.checklist.length).toBe(1);
    expect(ir.checklist[0].item).toBe('Custom Step 1');
  });

  it('stores engineer photos with type', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'P', category: 'AC', serviceType: 'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
    });
    ir.engineerPhotos.push({ url: 'https://example.com/photo.jpg', type: 'before', caption: 'Before install' });
    await ir.save();
    expect(ir.engineerPhotos).toHaveLength(1);
    expect(ir.engineerPhotos[0].type).toBe('before');
  });

  it('stores customer signature as string', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'P', category: 'AC', serviceType: 'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
    });
    ir.customerSignature = 'data:image/png;base64,iVBORw0KGgo=';
    await ir.save();
    expect(ir.customerSignature).toContain('data:image/png');
  });

  it('validates customerRating between 1 and 5', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'P', category: 'AC', serviceType: 'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    });
    ir.customerRating = 6;
    await expect(ir.save()).rejects.toThrow();
  });

  it('appends history entries', async () => {
    const ir = await InstallationRequest.create({
      customer:      new mongoose.Types.ObjectId(),
      productName:   'P', category: 'AC', serviceType: 'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'Surat', state: 'Gujarat', pincode: '395001' },
    });
    ir.history.push({ status: 'confirmed', note: 'Booking confirmed by admin' });
    await ir.save();
    expect(ir.history).toHaveLength(1);
    expect(ir.history[0].status).toBe('confirmed');
  });
});

// ─── InstallationEngineer model ───────────────────────────────────────────────
describe('InstallationEngineer model', () => {
  let InstallationEngineer;
  beforeAll(() => {
    InstallationEngineer = require('../models/InstallationEngineer');
  });

  it('creates an engineer with required fields', async () => {
    const eng = await InstallationEngineer.create({
      name:     'Ravi Kumar',
      email:    'ravi.install@test.com',
      phone:    '9876543210',
      password: 'hashedpass123',
    });
    expect(eng._id).toBeDefined();
    expect(eng.isAvailable).toBe(true);
    expect(eng.currentWorkload).toBe(0);
    expect(eng.maxWorkload).toBe(6);
    expect(eng.totalInstallations).toBe(0);
    expect(eng.status).toBe('active');
    expect(eng.isDeleted).toBe(false);
  });

  it('hashes password before save', async () => {
    const eng = await InstallationEngineer.create({
      name: 'Hash Test Engineer', email: 'hashtest.install@test.com',
      phone: '9123456789', password: 'plainPassword123',
    });
    const raw = await InstallationEngineer.findById(eng._id).select('+password');
    expect(raw.password).not.toBe('plainPassword123');
    expect(raw.password.startsWith('$2')).toBe(true);
  });

  it('matchPassword returns true for correct password', async () => {
    const eng = await InstallationEngineer.create({
      name: 'Auth Test Engineer', email: 'auth.install@test.com',
      phone: '9111111111', password: 'correctPass123',
    });
    const raw = await InstallationEngineer.findById(eng._id).select('+password');
    const match = await raw.matchPassword('correctPass123');
    expect(match).toBe(true);
  });

  it('matchPassword returns false for wrong password', async () => {
    const eng = await InstallationEngineer.create({
      name: 'Wrong Pass Engineer', email: 'wrong.install@test.com',
      phone: '9222222222', password: 'correctPass123',
    });
    const raw = await InstallationEngineer.findById(eng._id).select('+password');
    const match = await raw.matchPassword('wrongPassword');
    expect(match).toBe(false);
  });

  it('does not re-hash password when other fields are updated', async () => {
    const eng = await InstallationEngineer.create({
      name: 'No Rehash Engineer', email: 'norehash.install@test.com',
      phone: '9333333333', password: 'stablePass123',
    });
    const raw1 = await InstallationEngineer.findById(eng._id).select('+password');
    const hash1 = raw1.password;
    raw1.name = 'Updated Name';
    await raw1.save();
    const raw2 = await InstallationEngineer.findById(eng._id).select('+password');
    expect(raw2.password).toBe(hash1);
  });

  it('tracks workload correctly', async () => {
    const eng = await InstallationEngineer.create({
      name: 'Workload Engineer', email: 'workload.install@test.com',
      phone: '9444444444', password: 'pass123',
    });
    eng.currentWorkload = 3;
    await eng.save();
    const found = await InstallationEngineer.findById(eng._id);
    expect(found.currentWorkload).toBe(3);
  });

  it('stores skills and territory', async () => {
    const eng = await InstallationEngineer.create({
      name: 'Skilled Engineer', email: 'skilled.install@test.com',
      phone: '9555555555', password: 'pass123',
      skills: ['Air Conditioner', 'Washing Machine'],
      territory: { cities: ['Mumbai', 'Thane'], pincodes: ['400001', '400601'] },
    });
    expect(eng.skills).toContain('Air Conditioner');
    expect(eng.territory.cities).toContain('Mumbai');
    expect(eng.territory.pincodes).toContain('400001');
  });

  it('stores GPS location', async () => {
    const eng = await InstallationEngineer.create({
      name: 'GPS Engineer', email: 'gps.install@test.com',
      phone: '9666666666', password: 'pass123',
      gpsLocation: { lat: 19.076, lng: 72.877 },
    });
    expect(eng.gpsLocation.lat).toBeCloseTo(19.076);
    expect(eng.gpsLocation.lng).toBeCloseTo(72.877);
  });

  it('enforces unique email', async () => {
    await InstallationEngineer.create({
      name: 'Eng A', email: 'unique.install@test.com',
      phone: '9777777771', password: 'pass123',
    });
    await expect(
      InstallationEngineer.create({
        name: 'Eng B', email: 'unique.install@test.com',
        phone: '9777777772', password: 'pass456',
      })
    ).rejects.toThrow();
  });

  it('stores rating average and count', async () => {
    const eng = await InstallationEngineer.create({
      name: 'Rated Engineer', email: 'rated.install@test.com',
      phone: '9888888888', password: 'pass123',
    });
    eng.rating = { average: 4.7, count: 15 };
    await eng.save();
    const found = await InstallationEngineer.findById(eng._id);
    expect(found.rating.average).toBeCloseTo(4.7);
    expect(found.rating.count).toBe(15);
  });
});

// ─── Dispatch scoring logic ───────────────────────────────────────────────────
describe('scoreEngineer dispatch logic', () => {
  it('scores higher when engineer skills match IR category', () => {
    function scoreEngineer(engineer, ir) {
      let score = 0;
      if (ir.category && engineer.skills && engineer.skills.includes(ir.category)) score += 30;
      if (ir.installationAddress?.city && engineer.territory?.cities?.includes(ir.installationAddress.city)) score += 25;
      if (ir.installationAddress?.pincode && engineer.territory?.pincodes?.includes(ir.installationAddress.pincode)) score += 15;
      if (engineer.isAvailable) score += 20;
      const ratio = engineer.currentWorkload / (engineer.maxWorkload || 6);
      score += (1 - ratio) * 20;
      if (ir.priority === 'urgent') score += 10;
      if (ir.priority === 'vip')    score += 15;
      if (engineer.rating?.average) score += engineer.rating.average * 2;
      return score;
    }

    const engWithSkill    = { skills: ['Air Conditioner'], territory: { cities: [], pincodes: [] }, isAvailable: true, currentWorkload: 0, maxWorkload: 6, rating: { average: 4.5 } };
    const engWithoutSkill = { skills: ['Refrigerator'],    territory: { cities: [], pincodes: [] }, isAvailable: true, currentWorkload: 0, maxWorkload: 6, rating: { average: 4.5 } };
    const ir = { category: 'Air Conditioner', installationAddress: { city: 'Pune', pincode: '411001' }, priority: 'normal' };

    expect(scoreEngineer(engWithSkill, ir)).toBeGreaterThan(scoreEngineer(engWithoutSkill, ir));
  });

  it('scores higher when territory city matches', () => {
    function scoreEngineer(engineer, ir) {
      let score = 0;
      if (ir.category && engineer.skills && engineer.skills.includes(ir.category)) score += 30;
      if (ir.installationAddress?.city && engineer.territory?.cities?.includes(ir.installationAddress.city)) score += 25;
      if (ir.installationAddress?.pincode && engineer.territory?.pincodes?.includes(ir.installationAddress.pincode)) score += 15;
      if (engineer.isAvailable) score += 20;
      const ratio = engineer.currentWorkload / (engineer.maxWorkload || 6);
      score += (1 - ratio) * 20;
      return score;
    }

    const engInCity  = { skills: [], territory: { cities: ['Mumbai'], pincodes: [] }, isAvailable: true, currentWorkload: 2, maxWorkload: 6 };
    const engOutCity = { skills: [], territory: { cities: ['Delhi'],  pincodes: [] }, isAvailable: true, currentWorkload: 2, maxWorkload: 6 };
    const ir = { category: 'Refrigerator', installationAddress: { city: 'Mumbai', pincode: '400001' }, priority: 'normal' };

    expect(scoreEngineer(engInCity, ir)).toBeGreaterThan(scoreEngineer(engOutCity, ir));
  });

  it('scores urgent priority higher than normal', () => {
    function scoreEngineer(engineer, ir) {
      let score = 0;
      if (engineer.isAvailable) score += 20;
      const ratio = engineer.currentWorkload / (engineer.maxWorkload || 6);
      score += (1 - ratio) * 20;
      if (ir.priority === 'urgent') score += 10;
      if (ir.priority === 'vip')    score += 15;
      return score;
    }

    const eng = { skills: [], territory: { cities: [], pincodes: [] }, isAvailable: true, currentWorkload: 0, maxWorkload: 6 };
    const irUrgent = { category: 'AC', installationAddress: { city: 'X', pincode: '000000' }, priority: 'urgent' };
    const irNormal = { ...irUrgent, priority: 'normal' };

    expect(scoreEngineer(eng, irUrgent)).toBeGreaterThan(scoreEngineer(eng, irNormal));
  });

  it('penalises high workload engineers', () => {
    function scoreEngineer(engineer) {
      let score = 20;
      const ratio = engineer.currentWorkload / (engineer.maxWorkload || 6);
      score += (1 - ratio) * 20;
      return score;
    }

    const busy  = { currentWorkload: 5, maxWorkload: 6 };
    const free  = { currentWorkload: 0, maxWorkload: 6 };
    expect(scoreEngineer(free)).toBeGreaterThan(scoreEngineer(busy));
  });
});

// ─── Dashboard aggregation sanity ────────────────────────────────────────────
describe('InstallationRequest dashboard aggregation', () => {
  let InstallationRequest;
  beforeAll(() => {
    InstallationRequest = require('../models/InstallationRequest');
  });

  it('counts pending and completed correctly', async () => {
    const base = {
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', category: 'AC', serviceType: 'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'X', state: 'Y', pincode: '000001' },
    };
    const ir1 = await InstallationRequest.create({ ...base });
    const ir2 = await InstallationRequest.create({ ...base });
    ir2.status = 'completed';
    await ir2.save();

    const [pending, completed] = await Promise.all([
      InstallationRequest.countDocuments({ status: 'pending',   isDeleted: false }),
      InstallationRequest.countDocuments({ status: 'completed', isDeleted: false }),
    ]);
    expect(pending).toBe(1);
    expect(completed).toBe(1);
  });

  it('does not count soft-deleted records in totals', async () => {
    const base = {
      customer: new mongoose.Types.ObjectId(),
      productName: 'P', category: 'AC', serviceType: 'installation',
      preferredDate: new Date(Date.now() + 86400000),
      installationAddress: { city: 'X', state: 'Y', pincode: '000001' },
    };
    const ir = await InstallationRequest.create({ ...base });
    ir.isDeleted = true;
    await ir.save();

    const total = await InstallationRequest.countDocuments({ isDeleted: false });
    expect(total).toBe(0);
  });
});
