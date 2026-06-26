'use strict';
/**
 * Sprint 12B — Enterprise Production Planning & Scheduling
 * Tests: ProductionPlan, MasterProductionSchedule, CapacityPlan,
 *        MachineCalendar, ProductionCalendar, HolidayCalendar,
 *        PlanningScenario, PlanningConstraint
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_planning';

beforeAll(async () => { await mongoose.connect(MONGO_URI); });
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key of Object.keys(cols)) { await cols[key].deleteMany({}); }
});

const ProductionPlan          = require('../models/ProductionPlan');
const MasterProductionSchedule = require('../models/MasterProductionSchedule');
const CapacityPlan            = require('../models/CapacityPlan');
const MachineCalendar         = require('../models/MachineCalendar');
const ProductionCalendar      = require('../models/ProductionCalendar');
const HolidayCalendar         = require('../models/HolidayCalendar');
const PlanningScenario        = require('../models/PlanningScenario');
const PlanningConstraint      = require('../models/PlanningConstraint');

const factoryId    = new mongoose.Types.ObjectId();
const machineId    = new mongoose.Types.ObjectId();
const workCenterId = new mongoose.Types.ObjectId();
const userId       = new mongoose.Types.ObjectId();

// ── ProductionPlan ─────────────────────────────────────────────────────────────
describe('ProductionPlan model', () => {
  beforeAll(async () => { await ProductionPlan.createIndexes(); });

  test('creates plan with required fields', async () => {
    const p = await ProductionPlan.create({
      name: 'Q1 2026 Plan', planType: 'quarterly', factory: factoryId,
      periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-03-31'),
    });
    expect(p._id).toBeDefined();
    expect(p.status).toBe('draft');
    expect(p.version).toBe(1);
    expect(p.isDeleted).toBe(false);
  });

  test('auto-generates planNumber', async () => {
    const p = await ProductionPlan.create({
      name: 'June Plan', planType: 'monthly', factory: factoryId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-30'),
    });
    expect(p.planNumber).toMatch(/^PP-\d{4}-\d{5}$/);
  });

  test('rejects invalid status enum', async () => {
    await expect(ProductionPlan.create({
      name: 'Bad', planType: 'weekly', factory: factoryId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
      status: 'invalid_status',
    })).rejects.toThrow();
  });

  test('rejects invalid planType enum', async () => {
    await expect(ProductionPlan.create({
      name: 'Bad', planType: 'daily', factory: factoryId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-02'),
    })).rejects.toThrow();
  });

  test('planNumber is unique across sequential creates', async () => {
    const p1 = await ProductionPlan.create({
      name: 'Plan A', planType: 'weekly', factory: factoryId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
    });
    const p2 = await ProductionPlan.create({
      name: 'Plan B', planType: 'weekly', factory: factoryId,
      periodStart: new Date('2026-06-08'), periodEnd: new Date('2026-06-14'),
    });
    expect(p1.planNumber).not.toBe(p2.planNumber);
  });

  test('history array starts empty', async () => {
    const p = await ProductionPlan.create({
      name: 'Ann Plan', planType: 'annual', factory: factoryId,
      periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31'),
    });
    expect(p.history).toHaveLength(0);
  });
});

// ── MasterProductionSchedule ──────────────────────────────────────────────────
describe('MasterProductionSchedule model', () => {
  beforeAll(async () => { await MasterProductionSchedule.createIndexes(); });

  test('creates MPS with required fields', async () => {
    const planId = new mongoose.Types.ObjectId();
    const mps = await MasterProductionSchedule.create({
      plan: planId, factory: factoryId,
      year: 2026, periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
    });
    expect(mps._id).toBeDefined();
    expect(mps.status).toBe('draft');
    expect(mps.scheduledItems).toHaveLength(0);
  });

  test('auto-generates mpsNumber', async () => {
    const mps = await MasterProductionSchedule.create({
      plan: new mongoose.Types.ObjectId(), factory: factoryId,
      year: 2026, periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
    });
    expect(mps.mpsNumber).toMatch(/^MPS-\d{4}-\d{5}$/);
  });

  test('mpsNumber is unique across sequential creates', async () => {
    const m1 = await MasterProductionSchedule.create({
      plan: new mongoose.Types.ObjectId(), factory: factoryId,
      year: 2026, periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
    });
    const m2 = await MasterProductionSchedule.create({
      plan: new mongoose.Types.ObjectId(), factory: factoryId,
      year: 2026, periodStart: new Date('2026-06-08'), periodEnd: new Date('2026-06-14'),
    });
    expect(m1.mpsNumber).not.toBe(m2.mpsNumber);
  });

  test('rejects invalid status enum', async () => {
    await expect(MasterProductionSchedule.create({
      plan: new mongoose.Types.ObjectId(), factory: factoryId,
      year: 2026, periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
      status: 'running',
    })).rejects.toThrow();
  });
});

// ── CapacityPlan ───────────────────────────────────────────────────────────────
describe('CapacityPlan model', () => {
  test('creates capacity plan with defaults', async () => {
    const cp = await CapacityPlan.create({
      factory: factoryId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
    });
    expect(cp._id).toBeDefined();
    expect(cp.planType).toBe('weekly');
    expect(cp.isBottleneck).toBe(false);
    expect(cp.utilizationPct).toBe(0);
  });

  test('stores utilization percentage correctly', async () => {
    const cp = await CapacityPlan.create({
      factory: factoryId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
      availableCapacity: 100, allocatedCapacity: 75, utilizationPct: 75,
    });
    expect(cp.utilizationPct).toBe(75);
  });

  test('rejects utilizationPct > 100', async () => {
    await expect(CapacityPlan.create({
      factory: factoryId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
      utilizationPct: 150,
    })).rejects.toThrow();
  });

  test('bottleneck flag can be set', async () => {
    const cp = await CapacityPlan.create({
      factory: factoryId, workCenter: workCenterId,
      periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'),
      isBottleneck: true, bottleneckReason: 'Insufficient spindle capacity',
    });
    expect(cp.isBottleneck).toBe(true);
    expect(cp.bottleneckReason).toBe('Insufficient spindle capacity');
  });
});

// ── MachineCalendar ────────────────────────────────────────────────────────────
describe('MachineCalendar model', () => {
  beforeAll(async () => { await MachineCalendar.createIndexes(); });

  test('creates machine calendar entry', async () => {
    const mc = await MachineCalendar.create({
      machine: machineId, factory: factoryId, date: new Date('2026-06-16'),
    });
    expect(mc._id).toBeDefined();
    expect(mc.available).toBe(true);
    expect(mc.unavailableReason).toBe('');
  });

  test('marks machine unavailable with reason', async () => {
    const mc = await MachineCalendar.create({
      machine: machineId, factory: factoryId, date: new Date('2026-06-17'),
      available: false, unavailableReason: 'maintenance',
    });
    expect(mc.available).toBe(false);
    expect(mc.unavailableReason).toBe('maintenance');
  });

  test('enforces unique machine+date index', async () => {
    await MachineCalendar.create({
      machine: machineId, factory: factoryId, date: new Date('2026-06-18'),
    });
    await expect(MachineCalendar.create({
      machine: machineId, factory: factoryId, date: new Date('2026-06-18'),
    })).rejects.toThrow();
  });

  test('rejects invalid unavailableReason', async () => {
    await expect(MachineCalendar.create({
      machine: machineId, factory: factoryId, date: new Date('2026-06-19'),
      unavailableReason: 'coffee_break',
    })).rejects.toThrow();
  });
});

// ── ProductionCalendar ─────────────────────────────────────────────────────────
describe('ProductionCalendar model', () => {
  beforeAll(async () => { await ProductionCalendar.createIndexes(); });

  test('creates production calendar entry', async () => {
    const pc = await ProductionCalendar.create({
      factory: factoryId, date: new Date('2026-06-16'),
    });
    expect(pc._id).toBeDefined();
    expect(pc.isWorkingDay).toBe(true);
    expect(pc.plannedOutput).toBe(0);
  });

  test('marks non-working days', async () => {
    const pc = await ProductionCalendar.create({
      factory: factoryId, date: new Date('2026-06-21'),
      isWorkingDay: false, notes: 'Sunday',
    });
    expect(pc.isWorkingDay).toBe(false);
  });

  test('enforces unique factory+date index', async () => {
    await ProductionCalendar.create({
      factory: factoryId, date: new Date('2026-06-22'),
    });
    await expect(ProductionCalendar.create({
      factory: factoryId, date: new Date('2026-06-22'),
    })).rejects.toThrow();
  });
});

// ── HolidayCalendar ────────────────────────────────────────────────────────────
describe('HolidayCalendar model', () => {
  test('creates holiday with defaults', async () => {
    const h = await HolidayCalendar.create({
      name: 'Eid al-Adha', date: new Date('2026-06-28'),
    });
    expect(h._id).toBeDefined();
    expect(h.type).toBe('national');
    expect(h.recurring).toBe(false);
    expect(h.isDeleted).toBe(false);
  });

  test('supports all holiday types', async () => {
    const types = ['national','regional','factory','maintenance'];
    for (const type of types) {
      const h = await HolidayCalendar.create({
        name: `Test ${type}`, date: new Date('2026-07-01'), type,
      });
      expect(h.type).toBe(type);
      await HolidayCalendar.deleteMany({ type });
    }
  });

  test('rejects invalid type', async () => {
    await expect(HolidayCalendar.create({
      name: 'Bad', date: new Date('2026-06-29'), type: 'gazetted',
    })).rejects.toThrow();
  });

  test('recurring holiday stores year', async () => {
    const h = await HolidayCalendar.create({
      name: 'Independence Day', date: new Date('2026-08-14'),
      recurring: true, year: 2026,
    });
    expect(h.recurring).toBe(true);
    expect(h.year).toBe(2026);
  });
});

// ── PlanningScenario ───────────────────────────────────────────────────────────
describe('PlanningScenario model', () => {
  test('creates scenario with defaults', async () => {
    const s = await PlanningScenario.create({
      name: 'Optimistic Q3', factory: factoryId,
    });
    expect(s._id).toBeDefined();
    expect(s.status).toBe('draft');
    expect(s.efficiencyFactor).toBe(100);
    expect(s.lateOrderRisk).toBe('low');
    expect(s.isDeleted).toBe(false);
  });

  test('rejects efficiencyFactor > 200', async () => {
    await expect(PlanningScenario.create({
      name: 'Impossible', factory: factoryId, efficiencyFactor: 250,
    })).rejects.toThrow();
  });

  test('rejects invalid status', async () => {
    await expect(PlanningScenario.create({
      name: 'Bad Status', factory: factoryId, status: 'running',
    })).rejects.toThrow();
  });

  test('stores scenario parameters correctly', async () => {
    const s = await PlanningScenario.create({
      name: 'Conservative', factory: factoryId,
      targetOutput: 5000, efficiencyFactor: 85, extraShifts: 1,
      maintenanceBuffer: 10, lateOrderRisk: 'medium',
    });
    expect(s.targetOutput).toBe(5000);
    expect(s.efficiencyFactor).toBe(85);
    expect(s.lateOrderRisk).toBe('medium');
  });
});

// ── PlanningConstraint ─────────────────────────────────────────────────────────
describe('PlanningConstraint model', () => {
  test('creates constraint with required fields', async () => {
    const c = await PlanningConstraint.create({
      factory: factoryId, constraintType: 'capacity',
      title: 'Lathe capacity limit', validFrom: new Date('2026-06-01'),
    });
    expect(c._id).toBeDefined();
    expect(c.severity).toBe('medium');
    expect(c.isActive).toBe(true);
    expect(c.isDeleted).toBe(false);
  });

  test('rejects invalid constraintType', async () => {
    await expect(PlanningConstraint.create({
      factory: factoryId, constraintType: 'budget',
      title: 'Budget limit', validFrom: new Date('2026-06-01'),
    })).rejects.toThrow();
  });

  test('stores all severity levels', async () => {
    const severities = ['low','medium','high','critical'];
    for (const severity of severities) {
      const c = await PlanningConstraint.create({
        factory: factoryId, constraintType: 'operator',
        title: `${severity} constraint`, validFrom: new Date('2026-06-01'),
        severity,
      });
      expect(c.severity).toBe(severity);
      await PlanningConstraint.deleteMany({ severity });
    }
  });

  test('constraint with validTo is stored correctly', async () => {
    const c = await PlanningConstraint.create({
      factory: factoryId, constraintType: 'maintenance',
      title: 'Scheduled maintenance window',
      validFrom: new Date('2026-06-20'), validTo: new Date('2026-06-27'),
      value: 48, unit: 'hours',
    });
    expect(c.validTo).toEqual(new Date('2026-06-27'));
    expect(c.value).toBe(48);
    expect(c.unit).toBe('hours');
  });
});
