const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_barcode';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
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

// ─── EAN-13 checksum algorithm ────────────────────────────────────────────────

function ean13Checksum(digits12) {
  const d = String(digits12).replace(/\D/g, '').slice(0, 12);
  if (d.length !== 12) return null;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (sum % 10)) % 10);
}

function ean8Checksum(digits7) {
  const d = String(digits7).replace(/\D/g, '').slice(0, 7);
  if (d.length !== 7) return null;
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += Number(d[i]) * (i % 2 === 0 ? 3 : 1);
  return String((10 - (sum % 10)) % 10);
}

function upcaChecksum(digits11) {
  const d = String(digits11).replace(/\D/g, '').slice(0, 11);
  if (d.length !== 11) return null;
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += Number(d[i]) * (i % 2 === 0 ? 3 : 1);
  return String((10 - (sum % 10)) % 10);
}

function validateFormat(value, format) {
  switch (format) {
    case 'EAN13':   return /^\d{13}$/.test(value);
    case 'EAN8':    return /^\d{8}$/.test(value);
    case 'UPCA':    return /^\d{12}$/.test(value);
    case 'CODE128': return /^[\x20-\x7E]+$/.test(value);
    case 'CODE39':  return /^[A-Z0-9\-\.\ \$\/\+\%]+$/.test(value);
    case 'QR':      return value.length > 0 && value.length <= 2953;
    case 'INTERNAL':return /^[A-Z0-9\-_]+$/.test(value);
    default:        return false;
  }
}

describe('EAN-13 Checksum', () => {
  it('computes correct check digit for 890123456789x', () => {
    const check = ean13Checksum('890123456789');
    expect(check).toBeDefined();
    expect(check).toMatch(/^\d$/);
  });

  it('returns null for wrong length input', () => {
    expect(ean13Checksum('12345')).toBeNull();
  });

  it('produces valid 13-digit EAN', () => {
    const base = '890100000001';
    const check = ean13Checksum(base);
    const full  = base + check;
    expect(full).toHaveLength(13);
    expect(/^\d{13}$/.test(full)).toBe(true);
  });

  it('GS1 known vector: 4006381333931', () => {
    expect(ean13Checksum('400638133393')).toBe('1');
  });
});

describe('EAN-8 Checksum', () => {
  it('computes check digit for 7-digit input', () => {
    const check = ean8Checksum('9638507');
    expect(check).toMatch(/^\d$/);
  });

  it('returns null for wrong length', () => {
    expect(ean8Checksum('123')).toBeNull();
  });
});

describe('UPC-A Checksum', () => {
  it('computes check digit for 11-digit input', () => {
    const check = upcaChecksum('03600024145');
    expect(check).toMatch(/^\d$/);
  });

  it('known vector: 036000241457', () => {
    expect(upcaChecksum('03600024145')).toBe('7');
  });
});

describe('Format Validation', () => {
  it('validates EAN-13: 13 digits only', () => {
    expect(validateFormat('4006381333931', 'EAN13')).toBe(true);
    expect(validateFormat('400638133393',  'EAN13')).toBe(false);
    expect(validateFormat('40063813339A1', 'EAN13')).toBe(false);
  });

  it('validates EAN-8: 8 digits only', () => {
    expect(validateFormat('96385074', 'EAN8')).toBe(true);
    expect(validateFormat('9638507',  'EAN8')).toBe(false);
  });

  it('validates UPC-A: 12 digits', () => {
    expect(validateFormat('036000241457', 'UPCA')).toBe(true);
    expect(validateFormat('03600024145',  'UPCA')).toBe(false);
  });

  it('validates CODE128: printable ASCII', () => {
    expect(validateFormat('MTR-PRD-1234', 'CODE128')).toBe(true);
    expect(validateFormat('',            'CODE128')).toBe(false);
  });

  it('validates CODE39: uppercase alphanumeric + special', () => {
    expect(validateFormat('MTR1234', 'CODE39')).toBe(true);
    expect(validateFormat('mtr1234', 'CODE39')).toBe(false);
  });

  it('validates QR: any non-empty string up to 2953 chars', () => {
    expect(validateFormat('https://metro.app/scan?id=123', 'QR')).toBe(true);
    expect(validateFormat('', 'QR')).toBe(false);
    expect(validateFormat('A'.repeat(2954), 'QR')).toBe(false);
  });

  it('validates INTERNAL: uppercase alphanumeric + dash + underscore', () => {
    expect(validateFormat('PRD-ABC123-XY', 'INTERNAL')).toBe(true);
    expect(validateFormat('prd-abc123',    'INTERNAL')).toBe(false);
  });
});

describe('Barcode Model', () => {
  let Barcode;
  beforeAll(() => { Barcode = require('../models/Barcode'); });

  it('creates an EAN-13 barcode record', async () => {
    const doc = await Barcode.create({
      value: '4006381333931',
      format: 'EAN13',
      entityType: 'product',
      entityId: new mongoose.Types.ObjectId(),
      label: 'Test Product',
      checkDigit: '1',
      autoGenerated: true,
    });
    expect(doc._id).toBeDefined();
    expect(doc.format).toBe('EAN13');
    expect(doc.isActive).toBe(true);
    expect(doc.isPrinted).toBe(false);
  });

  it('rejects duplicate value+format', async () => {
    const entityId = new mongoose.Types.ObjectId();
    await Barcode.create({ value: 'MTR-TEST-001', format: 'INTERNAL', entityType: 'product', entityId });
    await expect(
      Barcode.create({ value: 'MTR-TEST-001', format: 'INTERNAL', entityType: 'product', entityId })
    ).rejects.toThrow();
  });

  it('allows same value in different formats', async () => {
    const entityId = new mongoose.Types.ObjectId();
    await Barcode.create({ value: 'ABC123', format: 'CODE128', entityType: 'product', entityId });
    const doc2 = await Barcode.create({ value: 'ABC123', format: 'CODE39', entityType: 'product', entityId });
    expect(doc2._id).toBeDefined();
  });
});

describe('ScanLog Model', () => {
  let ScanLog;
  beforeAll(() => { ScanLog = require('../models/ScanLog'); });

  it('creates a scan log entry', async () => {
    const log = await ScanLog.create({
      rawValue: '4006381333931',
      action:   'pick',
      result:   'success',
      scanType: 'barcode',
    });
    expect(log._id).toBeDefined();
    expect(log.result).toBe('success');
    expect(log.scannedAt).toBeInstanceOf(Date);
  });

  it('logs a failure with error message', async () => {
    const log = await ScanLog.create({
      rawValue: 'UNKNOWN-BARCODE',
      action:   'pick',
      result:   'not_found',
      errorMessage: 'Barcode not found in system',
    });
    expect(log.result).toBe('not_found');
    expect(log.errorMessage).toMatch(/not found/);
  });
});
