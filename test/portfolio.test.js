'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_portfolio';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
  await mongoose.connection.dropDatabase();

  require('../models/Portfolio');
  require('../models/Program');
  require('../models/ProgramProject');
  require('../models/StrategicInitiative');
  require('../models/PortfolioKPI');
  require('../models/PortfolioBudget');
  require('../models/PortfolioForecast');
  require('../models/PortfolioRisk');
  require('../models/PortfolioBenefit');
  require('../models/PortfolioRoadmap');
  require('../models/PortfolioMilestone');
  require('../models/PortfolioGovernance');
  require('../models/PortfolioApproval');
  require('../models/PortfolioStatusReport');
  require('../models/ResourceCapacity');
  require('../models/ResourceDemand');
  // Sprint 15A models referenced by rollups
  require('../models/Project');
  require('../models/ProjectCost');

  await mongoose.model('Portfolio').createIndexes();
  await mongoose.model('Program').createIndexes();
  await mongoose.model('ProgramProject').createIndexes();
  await mongoose.model('StrategicInitiative').createIndexes();
  await mongoose.model('PortfolioKPI').createIndexes();
  await mongoose.model('PortfolioBudget').createIndexes();
  await mongoose.model('PortfolioForecast').createIndexes();
  await mongoose.model('PortfolioRisk').createIndexes();
  await mongoose.model('PortfolioBenefit').createIndexes();
  await mongoose.model('PortfolioMilestone').createIndexes();
  await mongoose.model('PortfolioApproval').createIndexes();
  await mongoose.model('PortfolioStatusReport').createIndexes();
  await mongoose.model('ResourceCapacity').createIndexes();
}, 30000);

afterAll(async () => { await mongoose.disconnect(); });

const M = (n) => mongoose.model(n);
const fakeId = () => new mongoose.Types.ObjectId();

// ── 1. Portfolio ─────────────────────────────────────────────────────────────
describe('Portfolio', () => {
  let pid;
  test('creates with auto portfolioCode', async () => {
    const doc = await M('Portfolio').create({ name: 'Digital Transformation' });
    expect(doc.portfolioCode).toMatch(/^PF-\d{4}-\d{5}$/);
    expect(doc.status).toBe('draft');
    expect(doc.health).toBe('not_started');
    pid = doc._id;
  });
  test('defaults: priority medium, category strategic, currency INR', async () => {
    const doc = await M('Portfolio').create({ name: 'Ops Excellence' });
    expect(doc.priority).toBe('medium');
    expect(doc.category).toBe('strategic');
    expect(doc.currency).toBe('INR');
  });
  test('sequential codes increment', async () => {
    const a = await M('Portfolio').create({ name: 'PF A' });
    const b = await M('Portfolio').create({ name: 'PF B' });
    const na = Number(a.portfolioCode.split('-')[2]);
    const nb = Number(b.portfolioCode.split('-')[2]);
    expect(nb).toBe(na + 1);
  });
  test('name is required', async () => {
    await expect(M('Portfolio').create({})).rejects.toThrow();
  });
  test('soft delete via isDeleted', async () => {
    const doc = await M('Portfolio').create({ name: 'Temp' });
    await M('Portfolio').findByIdAndUpdate(doc._id, { isDeleted: true });
    const found = await M('Portfolio').findOne({ _id: doc._id, isDeleted: false });
    expect(found).toBeNull();
  });
  test('strategicAlignment + healthScore bounded fields persist', async () => {
    const doc = await M('Portfolio').create({ name: 'Aligned', strategicAlignment: 80, healthScore: 75, health: 'on_track' });
    expect(doc.strategicAlignment).toBe(80);
    expect(doc.health).toBe('on_track');
  });
});

// ── 2. Program ───────────────────────────────────────────────────────────────
describe('Program', () => {
  let portfolioId;
  beforeAll(async () => { portfolioId = (await M('Portfolio').create({ name: 'Prog Host' }))._id; });

  test('creates with auto programCode + portfolio ref', async () => {
    const doc = await M('Program').create({ name: 'Core ERP', portfolio: portfolioId });
    expect(doc.programCode).toMatch(/^PGM-\d{4}-\d{5}$/);
    expect(String(doc.portfolio)).toBe(String(portfolioId));
    expect(doc.status).toBe('planning');
  });
  test('portfolio is required', async () => {
    await expect(M('Program').create({ name: 'Orphan' })).rejects.toThrow();
  });
  test('completionPercent bounded 0..100', async () => {
    await expect(M('Program').create({ name: 'Bad', portfolio: portfolioId, completionPercent: 150 })).rejects.toThrow();
  });
});

// ── 3. ProgramProject mapping ────────────────────────────────────────────────
describe('ProgramProject', () => {
  let portfolioId, programId, projectId;
  beforeAll(async () => {
    portfolioId = (await M('Portfolio').create({ name: 'Map Host' }))._id;
    programId = (await M('Program').create({ name: 'Map Prog', portfolio: portfolioId }))._id;
    projectId = (await M('Project').create({ name: 'Mapped Project' }))._id;
  });
  test('maps a project into a program', async () => {
    const doc = await M('ProgramProject').create({ program: programId, portfolio: portfolioId, project: projectId });
    expect(doc.isActive).toBe(true);
    expect(doc.weight).toBe(100);
  });
  test('compound unique {program, project} prevents duplicates', async () => {
    await expect(M('ProgramProject').create({ program: programId, portfolio: portfolioId, project: projectId })).rejects.toThrow();
  });
  test('same project can map to a different program', async () => {
    const prog2 = await M('Program').create({ name: 'Map Prog 2', portfolio: portfolioId });
    const doc = await M('ProgramProject').create({ program: prog2._id, portfolio: portfolioId, project: projectId });
    expect(doc).toBeTruthy();
  });
});

// ── 4. StrategicInitiative ───────────────────────────────────────────────────
describe('StrategicInitiative', () => {
  test('creates with auto initiativeCode', async () => {
    const doc = await M('StrategicInitiative').create({ name: 'Market Expansion' });
    expect(doc.initiativeCode).toMatch(/^SI-\d{4}-\d{5}$/);
    expect(doc.status).toBe('proposed');
  });
  test('progress + alignment persist', async () => {
    const doc = await M('StrategicInitiative').create({ name: 'Green', targetValue: 100, currentValue: 40, progress: 40, alignment: 60 });
    expect(doc.progress).toBe(40);
    expect(doc.alignment).toBe(60);
  });
});

// ── 5. PortfolioKPI (RAG status) ─────────────────────────────────────────────
describe('PortfolioKPI', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'KPI Host' }))._id; });

  test('green when attainment >= thresholdGreen (higher_better)', async () => {
    const doc = await M('PortfolioKPI').create({ portfolio: pid, name: 'Delivery', targetValue: 100, actualValue: 95 });
    expect(doc.status).toBe('green');
  });
  test('amber between thresholds', async () => {
    const doc = await M('PortfolioKPI').create({ portfolio: pid, name: 'Velocity', targetValue: 100, actualValue: 75 });
    expect(doc.status).toBe('amber');
  });
  test('red below amber threshold', async () => {
    const doc = await M('PortfolioKPI').create({ portfolio: pid, name: 'Quality', targetValue: 100, actualValue: 40 });
    expect(doc.status).toBe('red');
  });
  test('lower_better direction inverts attainment', async () => {
    const doc = await M('PortfolioKPI').create({ portfolio: pid, name: 'Defects', direction: 'lower_better', targetValue: 10, actualValue: 10 });
    expect(doc.status).toBe('green');
  });
  test('no_data when targetValue is 0', async () => {
    const doc = await M('PortfolioKPI').create({ portfolio: pid, name: 'Unset', targetValue: 0, actualValue: 0 });
    expect(doc.status).toBe('no_data');
  });
});

// ── 6. PortfolioBudget ───────────────────────────────────────────────────────
describe('PortfolioBudget', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'Budget Host' }))._id; });
  test('creates one budget per portfolio', async () => {
    const doc = await M('PortfolioBudget').create({ portfolio: pid, totalBudget: 1000000, capexBudget: 600000 });
    expect(doc.totalBudget).toBe(1000000);
    expect(doc.currency).toBe('INR');
  });
  test('portfolio is unique (one budget per portfolio)', async () => {
    await expect(M('PortfolioBudget').create({ portfolio: pid, totalBudget: 50 })).rejects.toThrow();
  });
});

// ── 7. PortfolioForecast ─────────────────────────────────────────────────────
describe('PortfolioForecast', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'Forecast Host' }))._id; });
  test('creates forecast entry with period', async () => {
    const doc = await M('PortfolioForecast').create({ portfolio: pid, period: '2026-Q1', plannedCost: 100, forecastCost: 120 });
    expect(doc.period).toBe('2026-Q1');
    expect(doc.periodType).toBe('month');
  });
  test('period is required', async () => {
    await expect(M('PortfolioForecast').create({ portfolio: pid })).rejects.toThrow();
  });
});

// ── 8. PortfolioRisk ─────────────────────────────────────────────────────────
describe('PortfolioRisk', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'Risk Host' }))._id; });
  test('creates with auto riskCode', async () => {
    const doc = await M('PortfolioRisk').create({ portfolio: pid, title: 'Vendor lock-in', probability: 'high', impact: 'critical', riskScore: 12 });
    expect(doc.riskCode).toMatch(/^RSK-\d{4}-\d{5}$/);
    expect(doc.status).toBe('identified');
  });
  test('title + portfolio required', async () => {
    await expect(M('PortfolioRisk').create({ portfolio: pid })).rejects.toThrow();
  });
});

// ── 9. PortfolioBenefit (progress recompute) ─────────────────────────────────
describe('PortfolioBenefit', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'Benefit Host' }))._id; });
  test('auto benefitCode + progress derived from target/realized', async () => {
    const doc = await M('PortfolioBenefit').create({ portfolio: pid, name: 'Cost Savings', targetValue: 200, realizedValue: 50 });
    expect(doc.benefitCode).toMatch(/^BEN-\d{4}-\d{5}$/);
    expect(doc.progress).toBe(25);
  });
  test('progress caps at 100', async () => {
    const doc = await M('PortfolioBenefit').create({ portfolio: pid, name: 'Over', targetValue: 100, realizedValue: 250 });
    expect(doc.progress).toBe(100);
  });
  test('progress 0 when no target', async () => {
    const doc = await M('PortfolioBenefit').create({ portfolio: pid, name: 'NoTarget', targetValue: 0, realizedValue: 10 });
    expect(doc.progress).toBe(0);
  });
});

// ── 10. PortfolioRoadmap ─────────────────────────────────────────────────────
describe('PortfolioRoadmap', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'Roadmap Host' }))._id; });
  test('creates roadmap item with lane + type defaults', async () => {
    const doc = await M('PortfolioRoadmap').create({ portfolio: pid, title: 'Q1 Release' });
    expect(doc.lane).toBe('delivery');
    expect(doc.type).toBe('initiative');
    expect(doc.status).toBe('planned');
  });
});

// ── 11. PortfolioMilestone ───────────────────────────────────────────────────
describe('PortfolioMilestone', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'PMS Host' }))._id; });
  test('auto milestoneCode + pending default', async () => {
    const doc = await M('PortfolioMilestone').create({ portfolio: pid, name: 'Go-Live Gate' });
    expect(doc.milestoneCode).toMatch(/^PMS-\d{4}-\d{5}$/);
    expect(doc.status).toBe('pending');
  });
});

// ── 12. PortfolioGovernance ──────────────────────────────────────────────────
describe('PortfolioGovernance', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'Gov Host' }))._id; });
  test('creates governance gate with defaults', async () => {
    const doc = await M('PortfolioGovernance').create({ portfolio: pid, gateName: 'Stage 1 Review' });
    expect(doc.gateType).toBe('stage_gate');
    expect(doc.status).toBe('scheduled');
  });
  test('gateName required', async () => {
    await expect(M('PortfolioGovernance').create({ portfolio: pid })).rejects.toThrow();
  });
});

// ── 13. PortfolioApproval ────────────────────────────────────────────────────
describe('PortfolioApproval', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'Apr Host' }))._id; });
  test('auto approvalCode + pending default', async () => {
    const doc = await M('PortfolioApproval').create({ portfolio: pid, subject: 'Budget increase', requestType: 'budget', amount: 50000 });
    expect(doc.approvalCode).toMatch(/^APR-\d{4}-\d{5}$/);
    expect(doc.status).toBe('pending');
  });
});

// ── 14. PortfolioStatusReport ────────────────────────────────────────────────
describe('PortfolioStatusReport', () => {
  let pid;
  beforeAll(async () => { pid = (await M('Portfolio').create({ name: 'SR Host' }))._id; });
  test('auto reportCode + health defaults', async () => {
    const doc = await M('PortfolioStatusReport').create({ portfolio: pid, title: 'May Status' });
    expect(doc.reportCode).toMatch(/^PSR-\d{4}-\d{5}$/);
    expect(doc.overallHealth).toBe('on_track');
  });
  test('snapshot Mixed field stores arbitrary object', async () => {
    const doc = await M('PortfolioStatusReport').create({ portfolio: pid, title: 'Snap', snapshot: { a: 1, b: [2, 3] } });
    expect(doc.snapshot.b).toEqual([2, 3]);
  });
});

// ── 15. ResourceCapacity ─────────────────────────────────────────────────────
describe('ResourceCapacity', () => {
  test('creates capacity record', async () => {
    const doc = await M('ResourceCapacity').create({ employee: fakeId(), period: '2026-01', availableHours: 160 });
    expect(doc.periodType).toBe('month');
    expect(doc.availableHours).toBe(160);
  });
  test('compound unique {employee, period}', async () => {
    const emp = fakeId();
    await M('ResourceCapacity').create({ employee: emp, period: '2026-02', availableHours: 160 });
    await expect(M('ResourceCapacity').create({ employee: emp, period: '2026-02', availableHours: 140 })).rejects.toThrow();
  });
  test('same employee different period allowed', async () => {
    const emp = fakeId();
    await M('ResourceCapacity').create({ employee: emp, period: '2026-03', availableHours: 160 });
    const doc = await M('ResourceCapacity').create({ employee: emp, period: '2026-04', availableHours: 160 });
    expect(doc).toBeTruthy();
  });
});

// ── 16. ResourceDemand ───────────────────────────────────────────────────────
describe('ResourceDemand', () => {
  test('creates demand record with defaults', async () => {
    const doc = await M('ResourceDemand').create({ employee: fakeId(), period: '2026-01', demandHours: 80 });
    expect(doc.status).toBe('requested');
    expect(doc.priority).toBe('medium');
  });
  test('period required', async () => {
    await expect(M('ResourceDemand').create({ employee: fakeId() })).rejects.toThrow();
  });
});

// ── 17. Cross-model: demand vs capacity computation sanity ───────────────────
describe('Demand vs Capacity logic', () => {
  test('aggregates demand and capacity by period for a portfolio', async () => {
    const pid = (await M('Portfolio').create({ name: 'DVC Host' }))._id;
    const e1 = fakeId();
    await M('ResourceCapacity').create({ employee: e1, portfolio: pid, period: '2026-06', availableHours: 100 });
    await M('ResourceDemand').create({ employee: e1, portfolio: pid, period: '2026-06', demandHours: 60 });
    await M('ResourceDemand').create({ employee: e1, portfolio: pid, period: '2026-06', demandHours: 70 });

    const cap = await M('ResourceCapacity').aggregate([
      { $match: { portfolio: pid, isDeleted: false } },
      { $group: { _id: '$period', capacity: { $sum: '$availableHours' } } },
    ]);
    const dem = await M('ResourceDemand').aggregate([
      { $match: { portfolio: pid, isDeleted: false } },
      { $group: { _id: '$period', demand: { $sum: '$demandHours' } } },
    ]);
    expect(cap[0].capacity).toBe(100);
    expect(dem[0].demand).toBe(130);
    // overallocation: demand(130) > capacity(100)
    expect(dem[0].demand - cap[0].capacity).toBe(30);
  });
});

// ── 18. Cost rollup from Sprint 15A ProjectCost ──────────────────────────────
describe('Portfolio cost rollup', () => {
  test('rolls up ProjectCost across mapped projects', async () => {
    const pid = (await M('Portfolio').create({ name: 'Rollup Host' }))._id;
    const prog = await M('Program').create({ name: 'Rollup Prog', portfolio: pid });
    const proj = await M('Project').create({ name: 'Rollup Project' });
    await M('ProgramProject').create({ program: prog._id, portfolio: pid, project: proj._id });
    await M('ProjectCost').create({ project: proj._id, category: 'labor', amount: 5000, date: new Date(), description: 'Labor cost' });
    await M('ProjectCost').create({ project: proj._id, category: 'material', amount: 3000, date: new Date(), description: 'Material cost' });

    const mappings = await M('ProgramProject').find({ portfolio: pid, isActive: true }).select('project').lean();
    const projectIds = mappings.map(m => m.project);
    const agg = await M('ProjectCost').aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    expect(agg[0].total).toBe(8000);
  });
});
