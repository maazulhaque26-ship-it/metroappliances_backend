'use strict';
/**
 * Sprint 12C — Enterprise MRP
 * Tests: MRPRun, MaterialRequirement, MRPReservation, MRPRecommendation,
 *        MaterialShortage, PurchaseSuggestion, ProductionRequirement,
 *        DemandForecast, InventoryProjection, SafetyStockRule
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_mrp';

beforeAll(async () => { await mongoose.connect(MONGO_URI); });
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key of Object.keys(cols)) { await cols[key].deleteMany({}); }
});

const MRPRun              = require('../models/MRPRun');
const MaterialRequirement = require('../models/MaterialRequirement');
const MRPReservation      = require('../models/MRPReservation');
const MRPRecommendation   = require('../models/MRPRecommendation');
const MaterialShortage    = require('../models/MaterialShortage');
const PurchaseSuggestion  = require('../models/PurchaseSuggestion');
const ProductionRequirement = require('../models/ProductionRequirement');
const DemandForecast      = require('../models/DemandForecast');
const InventoryProjection = require('../models/InventoryProjection');
const SafetyStockRule     = require('../models/SafetyStockRule');

const fakeId = () => new mongoose.Types.ObjectId();
const today  = new Date();
const future = new Date(today); future.setDate(future.getDate() + 90);

// ─── MRPRun ─────────────────────────────────────────────────────────────────
describe('MRPRun model', () => {
  it('auto-generates runNumber on create', async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    expect(run.runNumber).toMatch(/^MRPR-\d{4}-\d{5}$/);
  });

  it('runNumbers are sequential', async () => {
    const r1 = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    const r2 = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    const n1 = parseInt(r1.runNumber.split('-')[2]);
    const n2 = parseInt(r2.runNumber.split('-')[2]);
    expect(n2).toBeGreaterThan(n1);
  });

  it('defaults status to pending', async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    expect(run.status).toBe('pending');
  });

  it('defaults planningHorizon to 90', async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    expect(run.planningHorizon).toBe(90);
  });

  it('defaults autoReserve to true', async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    expect(run.autoReserve).toBe(true);
  });

  it('rejects invalid status', async () => {
    await expect(MRPRun.create({ horizonStart: today, horizonEnd: future, status: 'invalid' })).rejects.toThrow();
  });

  it('soft delete pattern works', async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    run.isDeleted = true;
    await run.save();
    const found = await MRPRun.findOne({ _id: run._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ─── MaterialRequirement ────────────────────────────────────────────────────
describe('MaterialRequirement model', () => {
  let runId;
  beforeEach(async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    runId = run._id;
  });

  it('auto-generates requirementNumber', async () => {
    const req = await MaterialRequirement.create({ mrpRun: runId, material: fakeId() });
    expect(req.requirementNumber).toMatch(/^MRQ-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const req = await MaterialRequirement.create({ mrpRun: runId, material: fakeId() });
    expect(req.status).toBe('open');
  });

  it('requires mrpRun', async () => {
    await expect(MaterialRequirement.create({ material: fakeId() })).rejects.toThrow();
  });

  it('requires material', async () => {
    await expect(MaterialRequirement.create({ mrpRun: runId })).rejects.toThrow();
  });

  it('stores net requirement correctly', async () => {
    const req = await MaterialRequirement.create({
      mrpRun: runId, material: fakeId(),
      grossRequirement: 100, availableQty: 30, incomingPOQty: 20, netRequirement: 50,
    });
    expect(req.netRequirement).toBe(50);
  });

  it('rejects bomLevel > 10', async () => {
    await expect(MaterialRequirement.create({ mrpRun: runId, material: fakeId(), bomLevel: 11 })).rejects.toThrow();
  });
});

// ─── MRPReservation ─────────────────────────────────────────────────────────
describe('MRPReservation model', () => {
  let runId;
  beforeEach(async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    runId = run._id;
  });

  it('auto-generates reservationNumber', async () => {
    const res = await MRPReservation.create({ mrpRun: runId, material: fakeId(), quantity: 10 });
    expect(res.reservationNumber).toMatch(/^MRPRES-\d{4}-\d{5}$/);
  });

  it('defaults status to active', async () => {
    const res = await MRPReservation.create({ mrpRun: runId, material: fakeId(), quantity: 10 });
    expect(res.status).toBe('active');
  });

  it('requires quantity > 0', async () => {
    await expect(MRPReservation.create({ mrpRun: runId, material: fakeId(), quantity: 0 })).rejects.toThrow();
  });

  it('requires material', async () => {
    await expect(MRPReservation.create({ mrpRun: runId, quantity: 5 })).rejects.toThrow();
  });
});

// ─── MRPRecommendation ──────────────────────────────────────────────────────
describe('MRPRecommendation model', () => {
  let runId;
  beforeEach(async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    runId = run._id;
  });

  it('auto-generates recommendationNumber', async () => {
    const rec = await MRPRecommendation.create({ mrpRun: runId, type: 'purchase', material: fakeId(), quantity: 50 });
    expect(rec.recommendationNumber).toMatch(/^MRPREC-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const rec = await MRPRecommendation.create({ mrpRun: runId, type: 'production', material: fakeId(), quantity: 10 });
    expect(rec.status).toBe('open');
  });

  it('requires type', async () => {
    await expect(MRPRecommendation.create({ mrpRun: runId, material: fakeId(), quantity: 10 })).rejects.toThrow();
  });

  it('rejects invalid type', async () => {
    await expect(MRPRecommendation.create({ mrpRun: runId, type: 'magic', material: fakeId(), quantity: 10 })).rejects.toThrow();
  });

  it('defaults priority to medium', async () => {
    const rec = await MRPRecommendation.create({ mrpRun: runId, type: 'purchase', material: fakeId(), quantity: 10 });
    expect(rec.priority).toBe('medium');
  });
});

// ─── MaterialShortage ───────────────────────────────────────────────────────
describe('MaterialShortage model', () => {
  let runId;
  beforeEach(async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    runId = run._id;
  });

  it('creates shortage with severity', async () => {
    const s = await MaterialShortage.create({ mrpRun: runId, material: fakeId(), shortageQty: 25, severity: 'high' });
    expect(s.severity).toBe('high');
  });

  it('defaults status to open', async () => {
    const s = await MaterialShortage.create({ mrpRun: runId, material: fakeId(), shortageQty: 10 });
    expect(s.status).toBe('open');
  });

  it('requires shortageQty > 0', async () => {
    await expect(MaterialShortage.create({ mrpRun: runId, material: fakeId(), shortageQty: 0 })).rejects.toThrow();
  });

  it('rejects invalid severity', async () => {
    await expect(MaterialShortage.create({ mrpRun: runId, material: fakeId(), shortageQty: 10, severity: 'extreme' })).rejects.toThrow();
  });
});

// ─── PurchaseSuggestion ─────────────────────────────────────────────────────
describe('PurchaseSuggestion model', () => {
  let runId;
  beforeEach(async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    runId = run._id;
  });

  it('auto-generates suggestionNumber', async () => {
    const ps = await PurchaseSuggestion.create({ mrpRun: runId, material: fakeId(), quantity: 100 });
    expect(ps.suggestionNumber).toMatch(/^PS-\d{4}-\d{5}$/);
  });

  it('defaults status to pending', async () => {
    const ps = await PurchaseSuggestion.create({ mrpRun: runId, material: fakeId(), quantity: 100 });
    expect(ps.status).toBe('pending');
  });

  it('requires quantity > 0', async () => {
    await expect(PurchaseSuggestion.create({ mrpRun: runId, material: fakeId(), quantity: 0 })).rejects.toThrow();
  });

  it('multiple suggestions have sequential numbers', async () => {
    const p1 = await PurchaseSuggestion.create({ mrpRun: runId, material: fakeId(), quantity: 10 });
    const p2 = await PurchaseSuggestion.create({ mrpRun: runId, material: fakeId(), quantity: 20 });
    const n1 = parseInt(p1.suggestionNumber.split('-')[2]);
    const n2 = parseInt(p2.suggestionNumber.split('-')[2]);
    expect(n2).toBeGreaterThan(n1);
  });
});

// ─── ProductionRequirement ──────────────────────────────────────────────────
describe('ProductionRequirement model', () => {
  let runId;
  beforeEach(async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    runId = run._id;
  });

  it('auto-generates requirementNumber with PRODREQ prefix', async () => {
    const pr = await ProductionRequirement.create({ mrpRun: runId, product: fakeId(), quantity: 50 });
    expect(pr.requirementNumber).toMatch(/^PRODREQ-\d{4}-\d{5}$/);
  });

  it('defaults status to pending', async () => {
    const pr = await ProductionRequirement.create({ mrpRun: runId, product: fakeId(), quantity: 50 });
    expect(pr.status).toBe('pending');
  });

  it('defaults source to production_plan', async () => {
    const pr = await ProductionRequirement.create({ mrpRun: runId, product: fakeId(), quantity: 50 });
    expect(pr.source).toBe('production_plan');
  });
});

// ─── DemandForecast ─────────────────────────────────────────────────────────
describe('DemandForecast model', () => {
  it('creates forecast with correct values', async () => {
    const f = await DemandForecast.create({
      product: fakeId(), forecastPeriod: 'monthly',
      periodStart: today, periodEnd: future, forecastQty: 500,
    });
    expect(f.forecastQty).toBe(500);
    expect(f.isApproved).toBe(false);
  });

  it('defaults method to manual', async () => {
    const f = await DemandForecast.create({ product: fakeId(), periodStart: today, periodEnd: future, forecastQty: 100 });
    expect(f.method).toBe('manual');
  });

  it('requires product', async () => {
    await expect(DemandForecast.create({ periodStart: today, periodEnd: future, forecastQty: 100 })).rejects.toThrow();
  });

  it('rejects invalid forecastPeriod', async () => {
    await expect(DemandForecast.create({ product: fakeId(), periodStart: today, periodEnd: future, forecastQty: 100, forecastPeriod: 'daily' })).rejects.toThrow();
  });

  it('can be approved', async () => {
    const f = await DemandForecast.create({ product: fakeId(), periodStart: today, periodEnd: future, forecastQty: 200 });
    f.isApproved = true;
    await f.save();
    const found = await DemandForecast.findById(f._id);
    expect(found.isApproved).toBe(true);
  });
});

// ─── InventoryProjection ────────────────────────────────────────────────────
describe('InventoryProjection model', () => {
  let runId;
  beforeEach(async () => {
    const run = await MRPRun.create({ horizonStart: today, horizonEnd: future });
    runId = run._id;
  });

  it('creates projection correctly', async () => {
    const p = await InventoryProjection.create({
      mrpRun: runId, material: fakeId(), projectionDate: future,
      openingQty: 100, expectedIn: 50, expectedOut: 80, projectedQty: 70,
      safetyStock: 20,
    });
    expect(p.projectedQty).toBe(70);
    expect(p.isBelowSafety).toBe(false);
  });

  it('flags isBelowSafety correctly', async () => {
    const p = await InventoryProjection.create({
      mrpRun: runId, material: fakeId(), projectionDate: future,
      projectedQty: 5, safetyStock: 20, isBelowSafety: true,
    });
    expect(p.isBelowSafety).toBe(true);
  });

  it('requires projectionDate', async () => {
    await expect(InventoryProjection.create({ mrpRun: runId, material: fakeId() })).rejects.toThrow();
  });
});

// ─── SafetyStockRule ────────────────────────────────────────────────────────
describe('SafetyStockRule model', () => {
  it('creates rule with correct values', async () => {
    const rule = await SafetyStockRule.create({
      material: fakeId(), safetyStockQty: 50, reorderPoint: 100,
    });
    expect(rule.safetyStockQty).toBe(50);
    expect(rule.reorderPoint).toBe(100);
    expect(rule.isActive).toBe(true);
  });

  it('defaults method to fixed', async () => {
    const rule = await SafetyStockRule.create({ material: fakeId(), safetyStockQty: 10, reorderPoint: 20 });
    expect(rule.method).toBe('fixed');
  });

  it('defaults serviceLevel to 95', async () => {
    const rule = await SafetyStockRule.create({ material: fakeId(), safetyStockQty: 10, reorderPoint: 20 });
    expect(rule.serviceLevel).toBe(95);
  });

  it('enforces unique material constraint', async () => {
    const matId = fakeId();
    await SafetyStockRule.create({ material: matId, safetyStockQty: 10, reorderPoint: 20 });
    await expect(SafetyStockRule.create({ material: matId, safetyStockQty: 15, reorderPoint: 30 })).rejects.toThrow();
  });

  it('requires safetyStockQty', async () => {
    await expect(SafetyStockRule.create({ material: fakeId(), reorderPoint: 20 })).rejects.toThrow();
  });

  it('requires reorderPoint', async () => {
    await expect(SafetyStockRule.create({ material: fakeId(), safetyStockQty: 10 })).rejects.toThrow();
  });

  it('soft delete works', async () => {
    const rule = await SafetyStockRule.create({ material: fakeId(), safetyStockQty: 10, reorderPoint: 20 });
    rule.isDeleted = true;
    await rule.save();
    const found = await SafetyStockRule.findOne({ _id: rule._id, isDeleted: false });
    expect(found).toBeNull();
  });
});
