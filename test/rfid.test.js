/**
 * RFID model + logic tests — Sprint 10F
 * Tests EPC normalization, TTL index declarations, tag status lifecycle,
 * and bulk scan duplicate detection logic (pure in-memory, no HTTP server).
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_rfid';

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

// ─── EPC normalization helper (mirrors controller logic) ─────────────────────
function normalizeEPC(epc) {
  return epc.toUpperCase().trim();
}

// ─── Duplicate detection (mirrors rfidController.bulkScan) ───────────────────
function detectDuplicates(epcs) {
  const seen = new Set();
  const results = { total: epcs.length, known: 0, unknown: 0, duplicates: 0 };
  const upper = epcs.map(e => e.toUpperCase());
  for (const epc of upper) {
    if (seen.has(epc)) results.duplicates++;
    seen.add(epc);
  }
  return results;
}

describe('EPC normalization', () => {
  it('converts to uppercase', () => {
    expect(normalizeEPC('e280689400005014deadbeef')).toBe('E280689400005014DEADBEEF');
  });
  it('trims whitespace', () => {
    expect(normalizeEPC('  AABB  ')).toBe('AABB');
  });
  it('handles already-uppercase input unchanged', () => {
    expect(normalizeEPC('E280DEAD')).toBe('E280DEAD');
  });
});

describe('Bulk scan duplicate detection', () => {
  it('counts duplicates correctly', () => {
    const r = detectDuplicates(['AA', 'BB', 'AA', 'CC', 'BB', 'AA']);
    expect(r.total).toBe(6);
    expect(r.duplicates).toBe(3); // second AA, second BB, third AA
  });

  it('returns 0 duplicates for unique list', () => {
    const r = detectDuplicates(['AA', 'BB', 'CC']);
    expect(r.duplicates).toBe(0);
  });

  it('handles single-item list', () => {
    const r = detectDuplicates(['AABBCC']);
    expect(r.total).toBe(1);
    expect(r.duplicates).toBe(0);
  });

  it('is case-insensitive (normalizes before dedup)', () => {
    const r = detectDuplicates(['aabb', 'AABB']);
    expect(r.duplicates).toBe(1);
  });
});

describe('RFIDTag model', () => {
  let RFIDTag;
  beforeAll(async () => { RFIDTag = require('../models/RFIDTag'); await RFIDTag.createIndexes(); });

  it('creates a tag with required fields', async () => {
    const tag = await RFIDTag.create({
      epc: 'E280689400005014CAFEBABE',
      entityType: 'product',
    });
    expect(tag._id).toBeDefined();
    expect(tag.epc).toBe('E280689400005014CAFEBABE');
    expect(tag.status).toBe('active');
    expect(tag.isActive).toBe(true);
  });

  it('enforces unique EPC constraint', async () => {
    await RFIDTag.create({ epc: 'UNIQUEEPC001', entityType: 'pallet' });
    await expect(RFIDTag.create({ epc: 'UNIQUEEPC001', entityType: 'carton' })).rejects.toThrow();
  });

  it('stores history entries', async () => {
    const tag = await RFIDTag.create({
      epc: 'HISTORYTEST001',
      entityType: 'asset',
      history: [{ eventType: 'assignment', timestamp: new Date() }],
    });
    expect(tag.history).toHaveLength(1);
    expect(tag.history[0].eventType).toBe('assignment');
  });

  it('allows valid status values', async () => {
    for (const status of ['active', 'inactive', 'lost', 'damaged', 'replaced']) {
      const tag = await RFIDTag.create({ epc: `STATUS${status.toUpperCase()}`, entityType: 'product', status });
      expect(tag.status).toBe(status);
    }
  });

  it('rejects invalid status', async () => {
    await expect(RFIDTag.create({ epc: 'BADSTATUS', entityType: 'product', status: 'unknown_status' })).rejects.toThrow();
  });
});

describe('RFIDScan model', () => {
  let RFIDScan;
  beforeAll(() => { RFIDScan = require('../models/RFIDScan'); });

  it('creates scan with required epc', async () => {
    const scan = await RFIDScan.create({
      epc: 'SCANEPC001',
      eventType: 'bulk_scan',
      scannedAt: new Date(),
    });
    expect(scan._id).toBeDefined();
    expect(scan.epc).toBe('SCANEPC001');
    expect(scan.isDuplicate).toBe(false);
    expect(scan.isUnknown).toBe(false);
  });

  it('marks unknown scans correctly', async () => {
    const scan = await RFIDScan.create({
      epc: 'UNKNOWNEPC001',
      eventType: 'inventory_count',
      isUnknown: true,
      scannedAt: new Date(),
    });
    expect(scan.isUnknown).toBe(true);
  });

  it('has TTL index declared on scannedAt', () => {
    const schema = RFIDScan.schema;
    const idx = schema.indexes().find(([fields, opts]) => fields.scannedAt === 1 && opts.expireAfterSeconds !== undefined);
    expect(idx).toBeDefined();
    expect(idx[1].expireAfterSeconds).toBe(7_776_000); // 90 days
  });
});

describe('RFIDReader model', () => {
  let RFIDReader;
  beforeAll(() => {
    RFIDReader = require('../models/RFIDReader');
  });

  it('creates reader with required fields', async () => {
    const wId = new mongoose.Types.ObjectId();
    const reader = await RFIDReader.create({
      readerId: 'READER-001',
      name: 'Zone A Portal',
      type: 'fixed_portal',
      warehouseId: wId,
    });
    expect(reader._id).toBeDefined();
    expect(reader.status).toBe('offline');
    expect(reader.isActive).toBe(true);
  });

  it('rejects invalid reader type', async () => {
    const wId = new mongoose.Types.ObjectId();
    await expect(RFIDReader.create({
      readerId: 'READER-BAD',
      name: 'Bad Reader',
      type: 'helicopter_mounted',
      warehouseId: wId,
    })).rejects.toThrow();
  });
});
