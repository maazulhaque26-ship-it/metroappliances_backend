/**
 * Sprint 16B — AI Forecasting & Predictive Intelligence
 * 85 tests covering all 14 models
 * CRITICAL: Use sequential await (not Promise.all) for same-model creates
 *           due to auto-code race condition in pre-validate hooks
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_ai';

// Lazy model accessor — avoids OverwriteModelError
const M = (name) => mongoose.model(name);

const AIForecast           = () => M('AIForecast');
const AIForecastModel      = () => M('AIForecastModel');
const PredictionScenario   = () => M('PredictionScenario');
const SalesPrediction      = () => M('SalesPrediction');
const DemandPrediction     = () => M('DemandPrediction');
const InventoryPrediction  = () => M('InventoryPrediction');
const ProductionPrediction = () => M('ProductionPrediction');
const CashFlowPrediction   = () => M('CashFlowPrediction');
const WorkforcePrediction  = () => M('WorkforcePrediction');
const MaintenancePrediction= () => M('MaintenancePrediction');
const AIRecommendation     = () => M('AIRecommendation');
const AnomalyDetection     = () => M('AnomalyDetection');
const PredictionHistory    = () => M('PredictionHistory');
const PredictionSetting    = () => M('PredictionSetting');

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  // Register all models
  require('../models/AIForecast');
  require('../models/AIForecastModel');
  require('../models/PredictionScenario');
  require('../models/SalesPrediction');
  require('../models/DemandPrediction');
  require('../models/InventoryPrediction');
  require('../models/ProductionPrediction');
  require('../models/CashFlowPrediction');
  require('../models/WorkforcePrediction');
  require('../models/MaintenancePrediction');
  require('../models/AIRecommendation');
  require('../models/AnomalyDetection');
  require('../models/PredictionHistory');
  require('../models/PredictionSetting');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ─── AIForecast ──────────────────────────────────────────────────────────────
describe('AIForecast model', () => {
  it('creates a sales forecast with auto-code', async () => {
    const f = await AIForecast().create({
      forecastType: 'sales', algorithm: 'linear_regression', horizon: 6, status: 'completed',
      confidence: 82, predictions: [{ period: '2026-07', value: 100000, lowerBound: 90000, upperBound: 110000 }],
    });
    expect(f.forecastCode).toMatch(/^AIF-\d{4}-\d{5}$/);
    expect(f.forecastType).toBe('sales');
    expect(f.confidence).toBe(82);
  });

  it('requires forecastType', async () => {
    await expect(AIForecast().create({ algorithm: 'linear_regression' }))
      .rejects.toThrow(/forecastType/);
  });

  it('enforces valid forecastType enum', async () => {
    await expect(AIForecast().create({ forecastType: 'invalid_type' }))
      .rejects.toThrow();
  });

  it('defaults algorithm to linear_regression', async () => {
    const f = await AIForecast().create({ forecastType: 'demand', confidence: 70 });
    expect(f.algorithm).toBe('linear_regression');
  });

  it('defaults status to pending', async () => {
    const f = await AIForecast().create({ forecastType: 'revenue', confidence: 65 });
    expect(f.status).toBe('pending');
  });

  it('defaults confidence to 0', async () => {
    const f = await AIForecast().create({ forecastType: 'expense' });
    expect(f.confidence).toBe(0);
  });

  it('clamps confidence between 0 and 100', async () => {
    await expect(AIForecast().create({ forecastType: 'sales', confidence: 150 })).rejects.toThrow();
  });

  it('stores predictions array with period/value/bounds', async () => {
    const preds = [
      { period: '2026-07', value: 100, lowerBound: 90,  upperBound: 110 },
      { period: '2026-08', value: 110, lowerBound: 99,  upperBound: 121 },
    ];
    const f = await AIForecast().create({ forecastType: 'cashflow', confidence: 70, predictions: preds });
    expect(f.predictions).toHaveLength(2);
    expect(f.predictions[0].period).toBe('2026-07');
  });

  it('generates unique auto-codes sequentially', async () => {
    const f1 = await AIForecast().create({ forecastType: 'workforce', confidence: 72 });
    const f2 = await AIForecast().create({ forecastType: 'maintenance', confidence: 68 });
    expect(f1.forecastCode).not.toBe(f2.forecastCode);
    expect(f1.forecastCode).toMatch(/^AIF-/);
    expect(f2.forecastCode).toMatch(/^AIF-/);
  });

  it('stores metadata as mixed type', async () => {
    const f = await AIForecast().create({
      forecastType: 'production', confidence: 65,
      metadata: { machineCount: 10, utilization: 75, department: 'assembly' },
    });
    expect(f.metadata.machineCount).toBe(10);
    expect(f.metadata.department).toBe('assembly');
  });

  it('allows all forecastType enum values', async () => {
    const types = ['sales','demand','inventory','production','cashflow','revenue','expense','workforce','maintenance','warranty','project'];
    for (const type of types) {
      const f = await AIForecast().create({ forecastType: type, confidence: 60 });
      expect(f.forecastType).toBe(type);
    }
  });

  it('allows all algorithm enum values', async () => {
    const algos = ['linear_regression','moving_average','exponential_smoothing','arima','ml_hybrid'];
    for (const algo of algos) {
      const f = await AIForecast().create({ forecastType: 'sales', algorithm: algo, confidence: 60 });
      expect(f.algorithm).toBe(algo);
    }
  });

  it('allows all status enum values', async () => {
    const statuses = ['pending','processing','completed','failed'];
    for (const status of statuses) {
      const f = await AIForecast().create({ forecastType: 'demand', status, confidence: 60 });
      expect(f.status).toBe(status);
    }
  });
});

// ─── AIForecastModel ──────────────────────────────────────────────────────────
describe('AIForecastModel model', () => {
  it('creates with name and forecastType', async () => {
    const m = await AIForecastModel().create({
      name: 'Sales LR Model', forecastType: 'sales', algorithm: 'linear_regression',
    });
    expect(m.modelCode).toMatch(/^AFM-\d{4}-\d{5}$/);
    expect(m.name).toBe('Sales LR Model');
  });

  it('requires name', async () => {
    await expect(AIForecastModel().create({ forecastType: 'demand' })).rejects.toThrow(/name/);
  });

  it('requires forecastType', async () => {
    await expect(AIForecastModel().create({ name: 'Model X' })).rejects.toThrow(/forecastType/);
  });

  it('defaults isActive to true', async () => {
    const m = await AIForecastModel().create({ name: 'Demand ES', forecastType: 'demand' });
    expect(m.isActive).toBe(true);
  });

  it('defaults trainingPeriods to 12', async () => {
    const m = await AIForecastModel().create({ name: 'Inventory Model', forecastType: 'inventory' });
    expect(m.trainingPeriods).toBe(12);
  });

  it('generates unique auto-codes sequentially', async () => {
    const m1 = await AIForecastModel().create({ name: 'Model Alpha', forecastType: 'revenue' });
    const m2 = await AIForecastModel().create({ name: 'Model Beta', forecastType: 'expense' });
    expect(m1.modelCode).not.toBe(m2.modelCode);
  });

  it('stores parameters as mixed', async () => {
    const m = await AIForecastModel().create({
      name: 'ARIMA Config', forecastType: 'sales',
      parameters: { p: 2, d: 1, q: 2 },
    });
    expect(m.parameters.p).toBe(2);
  });
});

// ─── PredictionScenario ───────────────────────────────────────────────────────
describe('PredictionScenario model', () => {
  it('creates with name', async () => {
    const s = await PredictionScenario().create({
      name: 'Optimistic Growth', description: 'Best case 30% revenue growth',
    });
    expect(s.scenarioCode).toMatch(/^PSC-\d{4}-\d{5}$/);
    expect(s.name).toBe('Optimistic Growth');
  });

  it('requires name', async () => {
    await expect(PredictionScenario().create({})).rejects.toThrow(/name/);
  });

  it('defaults status to draft', async () => {
    const s = await PredictionScenario().create({ name: 'Base Scenario' });
    expect(s.status).toBe('draft');
  });

  it('allows all status enum values', async () => {
    const s1 = await PredictionScenario().create({ name: 'Active Scenario', status: 'active' });
    const s2 = await PredictionScenario().create({ name: 'Archived Scenario', status: 'archived' });
    expect(s1.status).toBe('active');
    expect(s2.status).toBe('archived');
  });

  it('stores assumptions and adjustments as mixed', async () => {
    const s = await PredictionScenario().create({
      name: 'Pessimistic Scenario',
      assumptions: { marketGrowth: -5, inflationRate: 8 },
      adjustments: { revenueFactor: 0.85 },
    });
    expect(s.assumptions.marketGrowth).toBe(-5);
    expect(s.adjustments.revenueFactor).toBe(0.85);
  });

  it('generates unique codes sequentially', async () => {
    const s1 = await PredictionScenario().create({ name: 'Scenario X' });
    const s2 = await PredictionScenario().create({ name: 'Scenario Y' });
    expect(s1.scenarioCode).not.toBe(s2.scenarioCode);
  });
});

// ─── SalesPrediction ─────────────────────────────────────────────────────────
describe('SalesPrediction model', () => {
  it('creates with period and predictedRevenue', async () => {
    const sp = await SalesPrediction().create({
      period: '2026-07', channel: 'b2c', predictedRevenue: 500000, confidence: 80,
    });
    expect(sp.predCode).toMatch(/^SPR-\d{4}-\d{5}$/);
    expect(sp.predictedRevenue).toBe(500000);
  });

  it('requires period', async () => {
    await expect(SalesPrediction().create({ predictedRevenue: 100000 })).rejects.toThrow(/period/);
  });

  it('requires predictedRevenue', async () => {
    await expect(SalesPrediction().create({ period: '2026-07' })).rejects.toThrow(/predictedRevenue/);
  });

  it('defaults channel to all', async () => {
    const sp = await SalesPrediction().create({ period: '2026-08', predictedRevenue: 300000 });
    expect(sp.channel).toBe('all');
  });

  it('allows all channel enum values', async () => {
    const channels = ['b2c','b2b','dealer','agent','all'];
    for (const channel of channels) {
      const sp = await SalesPrediction().create({ period: '2026-09', predictedRevenue: 100000, channel });
      expect(sp.channel).toBe(channel);
    }
  });
});

// ─── DemandPrediction ────────────────────────────────────────────────────────
describe('DemandPrediction model', () => {
  it('creates with required fields', async () => {
    const dp = await DemandPrediction().create({
      period: '2026-07', predictedUnits: 1200, confidence: 75,
    });
    expect(dp.predCode).toMatch(/^DPR-\d{4}-\d{5}$/);
    expect(dp.predictedUnits).toBe(1200);
  });

  it('requires period', async () => {
    await expect(DemandPrediction().create({ predictedUnits: 500 })).rejects.toThrow(/period/);
  });

  it('requires predictedUnits', async () => {
    await expect(DemandPrediction().create({ period: '2026-07' })).rejects.toThrow(/predictedUnits/);
  });

  it('defaults seasonalityIndex to 1', async () => {
    const dp = await DemandPrediction().create({ period: '2026-08', predictedUnits: 800 });
    expect(dp.seasonalityIndex).toBe(1);
  });

  it('defaults algorithm to exponential_smoothing', async () => {
    const dp = await DemandPrediction().create({ period: '2026-09', predictedUnits: 600 });
    expect(dp.algorithm).toBe('exponential_smoothing');
  });

  it('generates unique codes sequentially', async () => {
    const d1 = await DemandPrediction().create({ period: '2026-10', predictedUnits: 700 });
    const d2 = await DemandPrediction().create({ period: '2026-11', predictedUnits: 750 });
    expect(d1.predCode).not.toBe(d2.predCode);
  });
});

// ─── InventoryPrediction ──────────────────────────────────────────────────────
describe('InventoryPrediction model', () => {
  it('creates with required fields', async () => {
    const ip = await InventoryPrediction().create({
      period: '2026-07', riskLevel: 'medium', confidence: 72,
    });
    expect(ip.predCode).toMatch(/^IPR-\d{4}-\d{5}$/);
    expect(ip.riskLevel).toBe('medium');
  });

  it('requires period', async () => {
    await expect(InventoryPrediction().create({ riskLevel: 'low' })).rejects.toThrow(/period/);
  });

  it('defaults predictedStockouts to 0', async () => {
    const ip = await InventoryPrediction().create({ period: '2026-08' });
    expect(ip.predictedStockouts).toBe(0);
  });

  it('defaults predictedOverstock to 0', async () => {
    const ip = await InventoryPrediction().create({ period: '2026-09' });
    expect(ip.predictedOverstock).toBe(0);
  });

  it('defaults riskLevel to low', async () => {
    const ip = await InventoryPrediction().create({ period: '2026-10' });
    expect(ip.riskLevel).toBe('low');
  });

  it('enforces riskLevel enum', async () => {
    await expect(InventoryPrediction().create({ period: '2026-07', riskLevel: 'extreme' })).rejects.toThrow();
  });
});

// ─── ProductionPrediction ─────────────────────────────────────────────────────
describe('ProductionPrediction model', () => {
  it('creates with required fields', async () => {
    const pp = await ProductionPrediction().create({
      period: '2026-07', predictedCapacity: 1000, confidence: 68,
    });
    expect(pp.predCode).toMatch(/^PPR-\d{4}-\d{5}$/);
    expect(pp.predictedCapacity).toBe(1000);
  });

  it('requires period', async () => {
    await expect(ProductionPrediction().create({ predictedCapacity: 1000 })).rejects.toThrow(/period/);
  });

  it('requires predictedCapacity', async () => {
    await expect(ProductionPrediction().create({ period: '2026-07' })).rejects.toThrow(/predictedCapacity/);
  });

  it('defaults maintenanceRisk to low', async () => {
    const pp = await ProductionPrediction().create({ period: '2026-08', predictedCapacity: 800 });
    expect(pp.maintenanceRisk).toBe('low');
  });

  it('stores bottlenecks as string array', async () => {
    const pp = await ProductionPrediction().create({
      period: '2026-09', predictedCapacity: 700,
      bottlenecks: ['machine_3', 'assembly_line_2'],
    });
    expect(pp.bottlenecks).toContain('machine_3');
  });
});

// ─── CashFlowPrediction ───────────────────────────────────────────────────────
describe('CashFlowPrediction model', () => {
  it('creates with required fields', async () => {
    const cf = await CashFlowPrediction().create({
      period: '2026-07', predictedInflow: 2000000, predictedOutflow: 1500000, confidence: 65,
    });
    expect(cf.predCode).toMatch(/^CFP-\d{4}-\d{5}$/);
    expect(cf.predictedInflow).toBe(2000000);
  });

  it('requires predictedInflow', async () => {
    await expect(CashFlowPrediction().create({ period: '2026-07', predictedOutflow: 100000 })).rejects.toThrow(/predictedInflow/);
  });

  it('requires predictedOutflow', async () => {
    await expect(CashFlowPrediction().create({ period: '2026-07', predictedInflow: 200000 })).rejects.toThrow(/predictedOutflow/);
  });

  it('defaults cashPosition to healthy', async () => {
    const cf = await CashFlowPrediction().create({ period: '2026-08', predictedInflow: 100000, predictedOutflow: 80000 });
    expect(cf.cashPosition).toBe('healthy');
  });

  it('stores riskFactors as string array', async () => {
    const cf = await CashFlowPrediction().create({
      period: '2026-09', predictedInflow: 50000, predictedOutflow: 80000,
      cashPosition: 'critical', riskFactors: ['overdue_ar', 'seasonal_dip'],
    });
    expect(cf.riskFactors).toContain('overdue_ar');
  });

  it('enforces cashPosition enum', async () => {
    await expect(CashFlowPrediction().create({ period: '2026-07', predictedInflow: 100000, predictedOutflow: 80000, cashPosition: 'unknown' })).rejects.toThrow();
  });
});

// ─── WorkforcePrediction ──────────────────────────────────────────────────────
describe('WorkforcePrediction model', () => {
  it('creates with required fields', async () => {
    const wp = await WorkforcePrediction().create({
      period: '2026-07', predictedHeadcount: 250, confidence: 72,
    });
    expect(wp.predCode).toMatch(/^WFP-\d{4}-\d{5}$/);
    expect(wp.predictedHeadcount).toBe(250);
  });

  it('requires predictedHeadcount', async () => {
    await expect(WorkforcePrediction().create({ period: '2026-07' })).rejects.toThrow(/predictedHeadcount/);
  });

  it('defaults predictedAttrition to 0', async () => {
    const wp = await WorkforcePrediction().create({ period: '2026-08', predictedHeadcount: 200 });
    expect(wp.predictedAttrition).toBe(0);
  });

  it('defaults recruitmentNeeds to 0', async () => {
    const wp = await WorkforcePrediction().create({ period: '2026-09', predictedHeadcount: 180 });
    expect(wp.recruitmentNeeds).toBe(0);
  });

  it('defaults riskLevel to low', async () => {
    const wp = await WorkforcePrediction().create({ period: '2026-10', predictedHeadcount: 220 });
    expect(wp.riskLevel).toBe('low');
  });

  it('generates unique codes sequentially', async () => {
    const w1 = await WorkforcePrediction().create({ period: '2026-11', predictedHeadcount: 200 });
    const w2 = await WorkforcePrediction().create({ period: '2026-12', predictedHeadcount: 205 });
    expect(w1.predCode).not.toBe(w2.predCode);
  });
});

// ─── MaintenancePrediction ────────────────────────────────────────────────────
describe('MaintenancePrediction model', () => {
  it('creates with required fields', async () => {
    const mp = await MaintenancePrediction().create({
      period: '2026-07', predictedFailures: 3, avgRiskScore: 45, confidence: 70,
    });
    expect(mp.predCode).toMatch(/^MPR-\d{4}-\d{5}$/);
    expect(mp.predictedFailures).toBe(3);
  });

  it('requires period', async () => {
    await expect(MaintenancePrediction().create({ predictedFailures: 2 })).rejects.toThrow(/period/);
  });

  it('defaults predictedFailures to 0', async () => {
    const mp = await MaintenancePrediction().create({ period: '2026-08' });
    expect(mp.predictedFailures).toBe(0);
  });

  it('clamps avgRiskScore 0-100', async () => {
    await expect(MaintenancePrediction().create({ period: '2026-07', avgRiskScore: 150 })).rejects.toThrow();
  });

  it('stores recommendedActions as string array', async () => {
    const mp = await MaintenancePrediction().create({
      period: '2026-09', recommendedActions: ['Schedule PM', 'Replace filter'],
    });
    expect(mp.recommendedActions).toContain('Schedule PM');
  });

  it('generates unique codes sequentially', async () => {
    const m1 = await MaintenancePrediction().create({ period: '2026-10' });
    const m2 = await MaintenancePrediction().create({ period: '2026-11' });
    expect(m1.predCode).not.toBe(m2.predCode);
  });
});

// ─── AIRecommendation ────────────────────────────────────────────────────────
describe('AIRecommendation model', () => {
  it('creates with required fields', async () => {
    const r = await AIRecommendation().create({
      type: 'inventory',
      title: 'Replenish Stock',
      description: 'Reorder 50 SKUs below safety stock',
    });
    expect(r.recCode).toMatch(/^REC-\d{4}-\d{5}$/);
    expect(r.type).toBe('inventory');
    expect(r.priority).toBe('medium');
  });

  it('requires type', async () => {
    await expect(AIRecommendation().create({ title: 'X', description: 'Y' })).rejects.toThrow(/type/);
  });

  it('requires title', async () => {
    await expect(AIRecommendation().create({ type: 'sales', description: 'Y' })).rejects.toThrow(/title/);
  });

  it('requires description', async () => {
    await expect(AIRecommendation().create({ type: 'sales', title: 'X' })).rejects.toThrow(/description/);
  });

  it('defaults priority to medium', async () => {
    const r = await AIRecommendation().create({ type: 'production', title: 'T', description: 'D' });
    expect(r.priority).toBe('medium');
  });

  it('defaults status to pending', async () => {
    const r = await AIRecommendation().create({ type: 'procurement', title: 'T', description: 'D' });
    expect(r.status).toBe('pending');
  });

  it('defaults confidence to 70', async () => {
    const r = await AIRecommendation().create({ type: 'hiring', title: 'T', description: 'D' });
    expect(r.confidence).toBe(70);
  });

  it('defaults source to ai_engine', async () => {
    const r = await AIRecommendation().create({ type: 'training', title: 'T', description: 'D' });
    expect(r.source).toBe('ai_engine');
  });

  it('enforces type enum', async () => {
    await expect(AIRecommendation().create({ type: 'invalid', title: 'T', description: 'D' })).rejects.toThrow();
  });

  it('allows all priority enum values', async () => {
    const priorities = ['critical','high','medium','low'];
    for (const priority of priorities) {
      const r = await AIRecommendation().create({ type: 'maintenance', title: 'T', description: 'D', priority });
      expect(r.priority).toBe(priority);
    }
  });

  it('allows all status enum values', async () => {
    const statuses = ['pending','accepted','rejected','implemented','dismissed'];
    for (const status of statuses) {
      const r = await AIRecommendation().create({ type: 'cashflow', title: 'T', description: 'D', status });
      expect(r.status).toBe(status);
    }
  });

  it('generates unique codes sequentially', async () => {
    const r1 = await AIRecommendation().create({ type: 'portfolio', title: 'R1', description: 'D1' });
    const r2 = await AIRecommendation().create({ type: 'project',   title: 'R2', description: 'D2' });
    expect(r1.recCode).not.toBe(r2.recCode);
  });
});

// ─── AnomalyDetection ────────────────────────────────────────────────────────
describe('AnomalyDetection model', () => {
  it('creates with required fields', async () => {
    const a = await AnomalyDetection().create({
      type: 'demand_spike', module: 'orders', metric: 'order_count',
      actualValue: 500, expectedValue: 300, deviationPct: 66.7,
    });
    expect(a.anomalyCode).toMatch(/^ADT-\d{4}-\d{5}$/);
    expect(a.type).toBe('demand_spike');
    expect(a.isResolved).toBe(false);
  });

  it('requires type', async () => {
    await expect(AnomalyDetection().create({ module: 'orders', metric: 'count' })).rejects.toThrow(/type/);
  });

  it('requires module', async () => {
    await expect(AnomalyDetection().create({ type: 'sales_drop', metric: 'count' })).rejects.toThrow(/module/);
  });

  it('requires metric', async () => {
    await expect(AnomalyDetection().create({ type: 'sales_drop', module: 'orders' })).rejects.toThrow(/metric/);
  });

  it('defaults severity to medium', async () => {
    const a = await AnomalyDetection().create({ type: 'overstock', module: 'inventory', metric: 'qty' });
    expect(a.severity).toBe('medium');
  });

  it('defaults isResolved to false', async () => {
    const a = await AnomalyDetection().create({ type: 'cash_shortage', module: 'finance', metric: 'ar' });
    expect(a.isResolved).toBe(false);
  });

  it('enforces type enum', async () => {
    await expect(AnomalyDetection().create({ type: 'unknown_anomaly', module: 'm', metric: 'x' })).rejects.toThrow();
  });

  it('enforces severity enum', async () => {
    await expect(AnomalyDetection().create({ type: 'demand_spike', module: 'm', metric: 'x', severity: 'extreme' })).rejects.toThrow();
  });

  it('sets detectedAt to current time', async () => {
    const before = new Date();
    const a = await AnomalyDetection().create({ type: 'project_delay', module: 'projects', metric: 'delayed_count' });
    expect(a.detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
  });

  it('allows resolution fields', async () => {
    const a = await AnomalyDetection().create({
      type: 'machine_downtime', module: 'manufacturing', metric: 'machines_down',
      isResolved: true, resolvedAt: new Date(), resolutionNote: 'Machine repaired',
    });
    expect(a.isResolved).toBe(true);
    expect(a.resolutionNote).toBe('Machine repaired');
  });

  it('generates unique codes sequentially', async () => {
    const a1 = await AnomalyDetection().create({ type: 'supplier_risk', module: 'procurement', metric: 'delay_rate' });
    const a2 = await AnomalyDetection().create({ type: 'customer_churn', module: 'crm', metric: 'churn_rate' });
    expect(a1.anomalyCode).not.toBe(a2.anomalyCode);
  });

  it('allows all severity enum values', async () => {
    const severities = ['low','medium','high','critical'];
    for (const severity of severities) {
      const a = await AnomalyDetection().create({ type: 'cost_overrun', module: 'finance', metric: 'spend', severity });
      expect(a.severity).toBe(severity);
    }
  });
});

// ─── PredictionHistory ───────────────────────────────────────────────────────
describe('PredictionHistory model', () => {
  it('creates with required fields', async () => {
    const h = await PredictionHistory().create({
      forecastType: 'sales', period: '2026-01', predictedValue: 500000,
    });
    expect(h.historyCode).toMatch(/^PHT-\d{4}-\d{5}$/);
    expect(h.predictedValue).toBe(500000);
    expect(h.isActualized).toBe(false);
  });

  it('requires forecastType', async () => {
    await expect(PredictionHistory().create({ period: '2026-01', predictedValue: 100 })).rejects.toThrow(/forecastType/);
  });

  it('requires period', async () => {
    await expect(PredictionHistory().create({ forecastType: 'sales', predictedValue: 100 })).rejects.toThrow(/period/);
  });

  it('requires predictedValue', async () => {
    await expect(PredictionHistory().create({ forecastType: 'sales', period: '2026-01' })).rejects.toThrow(/predictedValue/);
  });

  it('defaults isActualized to false', async () => {
    const h = await PredictionHistory().create({ forecastType: 'demand', period: '2026-02', predictedValue: 800 });
    expect(h.isActualized).toBe(false);
  });

  it('allows actualization fields', async () => {
    const h = await PredictionHistory().create({
      forecastType: 'revenue', period: '2026-03', predictedValue: 1000000,
      actualValue: 950000, error: 50000, errorPct: 5, mape: 5, isActualized: true, actualizedAt: new Date(),
    });
    expect(h.isActualized).toBe(true);
    expect(h.mape).toBe(5);
  });

  it('generates unique codes sequentially', async () => {
    const h1 = await PredictionHistory().create({ forecastType: 'expense', period: '2026-04', predictedValue: 200000 });
    const h2 = await PredictionHistory().create({ forecastType: 'cashflow', period: '2026-05', predictedValue: 300000 });
    expect(h1.historyCode).not.toBe(h2.historyCode);
  });
});

// ─── PredictionSetting ───────────────────────────────────────────────────────
describe('PredictionSetting model', () => {
  beforeAll(async () => {
    await PredictionSetting().createIndexes();
  });

  it('creates with settingKey and settingValue', async () => {
    const s = await PredictionSetting().create({
      settingKey: 'test_algorithm_default', settingValue: 'linear_regression', category: 'algorithm',
    });
    expect(s.settingKey).toBe('test_algorithm_default');
    expect(s.settingValue).toBe('linear_regression');
    expect(s.isActive).toBe(true);
  });

  it('requires settingKey', async () => {
    await expect(PredictionSetting().create({ settingValue: 'x' })).rejects.toThrow(/settingKey/);
  });

  it('requires settingValue', async () => {
    await expect(PredictionSetting().create({ settingKey: 'orphan_key' })).rejects.toThrow(/settingValue/);
  });

  it('enforces unique settingKey', async () => {
    await PredictionSetting().create({ settingKey: 'unique_key_test', settingValue: 1 });
    await expect(PredictionSetting().create({ settingKey: 'unique_key_test', settingValue: 2 })).rejects.toThrow();
  });

  it('defaults category to general', async () => {
    const s = await PredictionSetting().create({ settingKey: 'test_general_key', settingValue: true });
    expect(s.category).toBe('general');
  });

  it('defaults isActive to true', async () => {
    const s = await PredictionSetting().create({ settingKey: 'test_active_key', settingValue: 'enabled' });
    expect(s.isActive).toBe(true);
  });

  it('enforces category enum', async () => {
    await expect(PredictionSetting().create({ settingKey: 'bad_cat', settingValue: 1, category: 'unknown' })).rejects.toThrow();
  });

  it('stores numeric settingValue', async () => {
    const s = await PredictionSetting().create({ settingKey: 'test_horizon_val', settingValue: 6, category: 'algorithm' });
    expect(s.settingValue).toBe(6);
  });

  it('stores object settingValue', async () => {
    const s = await PredictionSetting().create({ settingKey: 'test_obj_setting', settingValue: { k: 'v', n: 42 } });
    expect(s.settingValue.k).toBe('v');
  });

  it('allows all category enum values', async () => {
    const categories = ['algorithm','threshold','schedule','notification','general'];
    for (const category of categories) {
      const s = await PredictionSetting().create({ settingKey: `test_cat_${category}`, settingValue: 1, category });
      expect(s.category).toBe(category);
    }
  });
});

// ─── Cross-model integration ──────────────────────────────────────────────────
describe('AI Forecasting cross-model integration', () => {
  it('links SalesPrediction to AIForecast', async () => {
    const f = await AIForecast().create({ forecastType: 'sales', confidence: 80 });
    const sp = await SalesPrediction().create({ period: '2026-07', predictedRevenue: 500000, forecastId: f._id });
    expect(sp.forecastId.toString()).toBe(f._id.toString());
  });

  it('links DemandPrediction to AIForecast', async () => {
    const f = await AIForecast().create({ forecastType: 'demand', confidence: 72 });
    const dp = await DemandPrediction().create({ period: '2026-07', predictedUnits: 800, forecastId: f._id });
    expect(dp.forecastId.toString()).toBe(f._id.toString());
  });

  it('links PredictionHistory to AIForecast', async () => {
    const f  = await AIForecast().create({ forecastType: 'revenue', confidence: 78 });
    const h  = await PredictionHistory().create({ forecastId: f._id, forecastType: 'revenue', period: '2025-06', predictedValue: 800000 });
    expect(h.forecastId.toString()).toBe(f._id.toString());
  });

  it('links PredictionScenario to AIForecast baseline', async () => {
    const f = await AIForecast().create({ forecastType: 'cashflow', confidence: 65 });
    const s = await PredictionScenario().create({ name: 'Linked Scenario', baselineId: f._id });
    expect(s.baselineId.toString()).toBe(f._id.toString());
  });

  it('links AIRecommendation to AIForecast', async () => {
    const f = await AIForecast().create({ forecastType: 'inventory', confidence: 74 });
    const r = await AIRecommendation().create({
      type: 'inventory', title: 'Order More Stock', description: 'Based on demand forecast',
      forecastId: f._id,
    });
    expect(r.forecastId.toString()).toBe(f._id.toString());
  });

  it('counts all 14 AI models via mongoose', () => {
    const modelNames = [
      'AIForecast','AIForecastModel','PredictionScenario',
      'SalesPrediction','DemandPrediction','InventoryPrediction',
      'ProductionPrediction','CashFlowPrediction','WorkforcePrediction',
      'MaintenancePrediction','AIRecommendation','AnomalyDetection',
      'PredictionHistory','PredictionSetting',
    ];
    modelNames.forEach(name => expect(() => mongoose.model(name)).not.toThrow());
  });

  it('queries AIForecast by forecastType', async () => {
    await AIForecast().create({ forecastType: 'warranty', confidence: 62 });
    const results = await AIForecast().find({ forecastType: 'warranty' }).lean();
    expect(results.length).toBeGreaterThan(0);
  });

  it('queries AnomalyDetection by severity and isResolved', async () => {
    await AnomalyDetection().create({ type: 'inventory_shortage', module: 'inv', metric: 'qty', severity: 'critical', isResolved: false });
    const results = await AnomalyDetection().find({ severity: 'critical', isResolved: false }).lean();
    expect(results.length).toBeGreaterThan(0);
  });

  it('queries AIRecommendation by priority', async () => {
    await AIRecommendation().create({ type: 'production', title: 'Priority Test', description: 'Desc', priority: 'critical' });
    const results = await AIRecommendation().find({ priority: 'critical' }).lean();
    expect(results.length).toBeGreaterThan(0);
  });

  it('queries PredictionHistory by isActualized', async () => {
    await PredictionHistory().create({ forecastType: 'sales', period: '2025-12', predictedValue: 900000, isActualized: true, actualValue: 870000 });
    const results = await PredictionHistory().find({ isActualized: true }).lean();
    expect(results.length).toBeGreaterThan(0);
  });

  it('queries PredictionSetting by category', async () => {
    await PredictionSetting().create({ settingKey: 'integration_test_algo', settingValue: 'arima', category: 'algorithm' });
    const results = await PredictionSetting().find({ category: 'algorithm' }).lean();
    expect(results.length).toBeGreaterThan(0);
  });

  it('aggregates AIRecommendation counts by type', async () => {
    const agg = await AIRecommendation().aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    expect(Array.isArray(agg)).toBe(true);
    expect(agg.length).toBeGreaterThan(0);
  });

  it('aggregates AnomalyDetection by module', async () => {
    const agg = await AnomalyDetection().aggregate([{ $group: { _id: '$module', count: { $sum: 1 } } }]);
    expect(Array.isArray(agg)).toBe(true);
  });

  it('handles empty queries gracefully', async () => {
    const forecasts = await AIForecast().find({ forecastType: 'nonexistent_type_xyz' }).lean();
    expect(forecasts).toHaveLength(0);
  });

  it('marks AnomalyDetection as resolved', async () => {
    const a = await AnomalyDetection().create({ type: 'demand_spike', module: 'orders', metric: 'orders', severity: 'high' });
    const resolved = await AnomalyDetection().findByIdAndUpdate(a._id, { isResolved: true, resolvedAt: new Date() }, { new: true });
    expect(resolved.isResolved).toBe(true);
    expect(resolved.resolvedAt).toBeDefined();
  });
});
