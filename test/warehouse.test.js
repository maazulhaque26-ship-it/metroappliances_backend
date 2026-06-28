/**
 * Warehouse model tests — Sprint 10A
 * Run: npx jest test/warehouse.test.js
 */
const mongoose      = require('mongoose');
const Warehouse     = require('../models/Warehouse');
const WarehouseZone = require('../models/WarehouseZone');
const WarehouseUser = require('../models/WarehouseUser');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_warehouse';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  // Ensure the unique index on Warehouse.code is built before the uniqueness
  // assertion runs. A prior test file sharing this database may have dropped
  // the collection/index, and Mongoose does not rebuild autoIndex for an
  // already-initialized model on reconnect.
  await Warehouse.createIndexes();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('Warehouse model', () => {
  it('creates a valid warehouse', async () => {
    const wh = await Warehouse.create({
      code:    'MUM01',
      name:    'Mumbai Central Warehouse',
      address: '123 Dharavi Road',
      city:    'Mumbai',
      state:   'Maharashtra',
    });
    expect(wh._id).toBeDefined();
    expect(wh.code).toBe('MUM01');
    expect(wh.status).toBe('active');
    expect(wh.isDeleted).toBe(false);
  });

  it('requires code, name, address, city, state', async () => {
    await expect(Warehouse.create({ name: 'Test' })).rejects.toThrow();
  });

  it('enforces unique code', async () => {
    await Warehouse.create({ code: 'DEL01', name: 'Delhi WH', address: 'A', city: 'Delhi', state: 'Delhi' });
    await expect(
      Warehouse.create({ code: 'DEL01', name: 'Duplicate', address: 'B', city: 'Delhi', state: 'Delhi' })
    ).rejects.toThrow();
  });
});

describe('WarehouseZone model', () => {
  let warehouseId;

  beforeEach(async () => {
    const wh = await Warehouse.create({ code: 'TEST1', name: 'Test WH', address: 'A', city: 'B', state: 'C' });
    warehouseId = wh._id;
  });

  it('creates a valid zone', async () => {
    const zone = await WarehouseZone.create({ warehouse: warehouseId, code: 'REC01', name: 'Receiving A', type: 'receiving' });
    expect(zone._id).toBeDefined();
    expect(zone.type).toBe('receiving');
    expect(zone.isActive).toBe(true);
  });

  it('rejects invalid zone type', async () => {
    await expect(
      WarehouseZone.create({ warehouse: warehouseId, code: 'Z1', name: 'Bad', type: 'invalid_type' })
    ).rejects.toThrow();
  });
});

describe('WarehouseUser model', () => {
  let warehouseId;

  beforeEach(async () => {
    const wh = await Warehouse.create({ code: 'USR01', name: 'User WH', address: 'A', city: 'B', state: 'C' });
    warehouseId = wh._id;
  });

  it('creates a warehouse user and hashes password', async () => {
    const user = await WarehouseUser.create({
      name: 'Raj Kumar', email: 'raj@warehouse.com',
      password: 'password123', role: 'picker', warehouse: warehouseId,
    });
    expect(user._id).toBeDefined();
    expect(user.role).toBe('picker');
    expect(user.status).toBe('active');

    const userWithPass = await WarehouseUser.findById(user._id).select('+password');
    expect(userWithPass.password).not.toBe('password123');
  });

  it('verifies password with matchPassword()', async () => {
    const user = await WarehouseUser.create({
      name: 'Priya', email: 'priya@wh.com',
      password: 'secret99', role: 'packer', warehouse: warehouseId,
    });
    const found = await WarehouseUser.findById(user._id).select('+password');
    expect(await found.matchPassword('secret99')).toBe(true);
    expect(await found.matchPassword('wrongpass')).toBe(false);
  });

  it('rejects invalid role', async () => {
    await expect(
      WarehouseUser.create({ name: 'X', email: 'x@x.com', password: '123456', role: 'hacker', warehouse: warehouseId })
    ).rejects.toThrow();
  });
});
