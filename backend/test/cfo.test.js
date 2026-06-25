'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_cfo';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
  await mongoose.connection.dropDatabase();

  const Budget                  = require('../models/Budget');
  const BudgetLine              = require('../models/BudgetLine');
  const BudgetScenario          = require('../models/BudgetScenario');
  const FinancialForecast       = require('../models/FinancialForecast');
  const ForecastLine            = require('../models/ForecastLine');
  const FinancialKPI            = require('../models/FinancialKPI');
  const KPIThreshold            = require('../models/KPIThreshold');
  const ConsolidationGroup      = require('../models/ConsolidationGroup');
  const ConsolidationCompany    = require('../models/ConsolidationCompany');
  const InterCompanyTransaction = require('../models/InterCompanyTransaction');
  const EliminationEntry        = require('../models/EliminationEntry');
  const FinancialSnapshot       = require('../models/FinancialSnapshot');
  const FinancialReport         = require('../models/FinancialReport');
  const VarianceAnalysis        = require('../models/VarianceAnalysis');
  const CashFlowStatement       = require('../models/CashFlowStatement');
  const ProfitabilityAnalysis   = require('../models/ProfitabilityAnalysis');
  const FinancialAlert          = require('../models/FinancialAlert');
  const BoardReport             = require('../models/BoardReport');
  const ExecutiveDashboardSetting = require('../models/ExecutiveDashboardSetting');

  await Promise.all([
    Budget.syncIndexes(),
    BudgetLine.syncIndexes(),
    BudgetScenario.syncIndexes(),
    FinancialForecast.syncIndexes(),
    ForecastLine.syncIndexes(),
    FinancialKPI.syncIndexes(),
    KPIThreshold.syncIndexes(),
    ConsolidationGroup.syncIndexes(),
    ConsolidationCompany.syncIndexes(),
    InterCompanyTransaction.syncIndexes(),
    EliminationEntry.syncIndexes(),
    FinancialSnapshot.syncIndexes(),
    FinancialReport.syncIndexes(),
    VarianceAnalysis.syncIndexes(),
    CashFlowStatement.syncIndexes(),
    ProfitabilityAnalysis.syncIndexes(),
    FinancialAlert.syncIndexes(),
    BoardReport.syncIndexes(),
    ExecutiveDashboardSetting.syncIndexes(),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

// ── 1. Budget ─────────────────────────────────────────────────────────────────
describe('Budget', () => {
  const Budget = () => require('../models/Budget');

  it('creates with required fields', async () => {
    const B = Budget();
    const doc = await B.create({ budgetName: 'FY2025 Annual', budgetType: 'annual', totalBudget: 10000000 });
    expect(doc.budgetName).toBe('FY2025 Annual');
    expect(doc.budgetType).toBe('annual');
    expect(doc.status).toBe('draft');
    expect(doc.budgetNumber).toMatch(/^BUD-/);
    expect(doc.isDeleted).toBe(false);
  });

  it('auto-generates budgetNumber', async () => {
    const B = Budget();
    const a = await B.create({ budgetName: 'A', budgetType: 'monthly', totalBudget: 100 });
    const b = await B.create({ budgetName: 'B', budgetType: 'monthly', totalBudget: 200 });
    expect(a.budgetNumber).not.toBe(b.budgetNumber);
  });

  it('rejects missing budgetName', async () => {
    const B = Budget();
    await expect(B.create({ budgetType: 'annual', totalBudget: 0 })).rejects.toThrow();
  });

  it('rejects invalid budgetType', async () => {
    const B = Budget();
    await expect(B.create({ budgetName: 'X', budgetType: 'invalid', totalBudget: 0 })).rejects.toThrow();
  });

  it('allows status transitions', async () => {
    const B = Budget();
    const doc = await B.create({ budgetName: 'T', budgetType: 'department', totalBudget: 50000 });
    doc.status = 'submitted';
    await doc.save();
    expect(doc.status).toBe('submitted');
  });

  it('soft delete via isDeleted', async () => {
    const B = Budget();
    const doc = await B.create({ budgetName: 'Del Test', budgetType: 'project', totalBudget: 0 });
    doc.isDeleted = true;
    await doc.save();
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 2. BudgetLine ─────────────────────────────────────────────────────────────
describe('BudgetLine', () => {
  const BudgetLine = () => require('../models/BudgetLine');
  const Budget     = () => require('../models/Budget');

  it('creates with required fields', async () => {
    const budget = await Budget().create({ budgetName: 'BL Test', budgetType: 'annual', totalBudget: 0 });
    const BL = BudgetLine();
    const line = await BL.create({ budget: budget._id, category: 'revenue', accountCode: 'REV001', accountName: 'Product Revenue' });
    expect(line.budget.toString()).toBe(budget._id.toString());
    expect(line.category).toBe('revenue');
    expect(line.accountCode).toBe('REV001');
  });

  it('defaults monthly budget fields to 0', async () => {
    const budget = await Budget().create({ budgetName: 'BL2', budgetType: 'annual', totalBudget: 0 });
    const line = await BudgetLine().create({ budget: budget._id, category: 'cogs', accountCode: 'COGS001', accountName: 'COGS' });
    expect(line.janBudget).toBe(0);
    expect(line.decBudget).toBe(0);
  });

  it('rejects missing budget', async () => {
    await expect(BudgetLine().create({ category: 'revenue', accountCode: 'X', accountName: 'Y' })).rejects.toThrow();
  });
});

// ── 3. BudgetScenario ────────────────────────────────────────────────────────
describe('BudgetScenario', () => {
  const BS     = () => require('../models/BudgetScenario');
  const Budget = () => require('../models/Budget');

  it('creates a scenario', async () => {
    const budget = await Budget().create({ budgetName: 'Scen', budgetType: 'annual', totalBudget: 0 });
    const sc = await BS().create({ budget: budget._id, scenarioName: 'Best Case', scenarioType: 'best_case', revenueAdjPct: 15, adjustmentFactor: 1.15 });
    expect(sc.scenarioType).toBe('best_case');
    expect(sc.revenueAdjPct).toBe(15);
  });

  it('rejects invalid scenarioType', async () => {
    const budget = await Budget().create({ budgetName: 'X', budgetType: 'annual', totalBudget: 0 });
    await expect(BS().create({ budget: budget._id, scenarioName: 'Bad', scenarioType: 'unknown' })).rejects.toThrow();
  });
});

// ── 4. FinancialForecast ─────────────────────────────────────────────────────
describe('FinancialForecast', () => {
  const FF = () => require('../models/FinancialForecast');

  it('creates with required fields', async () => {
    const doc = await FF().create({ forecastName: 'Q1 2025 Forecast', forecastType: 'quarterly', scenario: 'expected', startDate: new Date() });
    expect(doc.forecastName).toBe('Q1 2025 Forecast');
    expect(doc.forecastNumber).toMatch(/^FFCST-/);
    expect(doc.status).toBe('draft');
  });

  it('auto-generates forecastNumber', async () => {
    const a = await FF().create({ forecastName: 'A', forecastType: 'monthly', scenario: 'best_case', startDate: new Date() });
    const b = await FF().create({ forecastName: 'B', forecastType: 'monthly', scenario: 'worst_case', startDate: new Date() });
    expect(a.forecastNumber).not.toBe(b.forecastNumber);
  });

  it('rejects missing forecastName', async () => {
    await expect(FF().create({ forecastType: 'annual', scenario: 'expected', startDate: new Date() })).rejects.toThrow();
  });

  it('rejects invalid scenario', async () => {
    await expect(FF().create({ forecastName: 'X', forecastType: 'annual', scenario: 'invalid', startDate: new Date() })).rejects.toThrow();
  });

  it('stores financial totals', async () => {
    const doc = await FF().create({ forecastName: 'Rev FC', forecastType: 'rolling_12', scenario: 'expected', startDate: new Date(), totalRevenue: 50000000, totalExpenses: 30000000 });
    expect(doc.totalRevenue).toBe(50000000);
    expect(doc.totalExpenses).toBe(30000000);
  });
});

// ── 5. ForecastLine ──────────────────────────────────────────────────────────
describe('ForecastLine', () => {
  const FL = () => require('../models/ForecastLine');
  const FF = () => require('../models/FinancialForecast');

  it('creates with required fields', async () => {
    const forecast = await FF().create({ forecastName: 'FL Test', forecastType: 'monthly', scenario: 'expected', startDate: new Date() });
    const line = await FL().create({ forecast: forecast._id, period: '2025-06', category: 'revenue', forecastAmount: 1000000 });
    expect(line.period).toBe('2025-06');
    expect(line.category).toBe('revenue');
    expect(line.forecastAmount).toBe(1000000);
  });

  it('rejects missing forecast', async () => {
    await expect(FL().create({ period: '2025-06', category: 'revenue', forecastAmount: 0 })).rejects.toThrow();
  });
});

// ── 6. FinancialKPI ──────────────────────────────────────────────────────────
describe('FinancialKPI', () => {
  const FK = () => require('../models/FinancialKPI');

  it('creates KPI snapshot', async () => {
    const doc = await FK().create({ period: '2025-06', revenue: 10000000, grossProfit: 4000000, netProfit: 1500000 });
    expect(doc.period).toBe('2025-06');
    expect(doc.revenue).toBe(10000000);
    expect(doc.grossProfit).toBe(4000000);
  });

  it('stores all margin fields', async () => {
    const doc = await FK().create({ period: '2025-07', grossMargin: 40.5, operatingMargin: 15.2, netMargin: 10.1, roa: 5.5, roe: 12.3 });
    expect(doc.grossMargin).toBe(40.5);
    expect(doc.netMargin).toBe(10.1);
    expect(doc.roe).toBe(12.3);
  });

  it('stores liquidity ratios', async () => {
    const doc = await FK().create({ period: '2025-08', currentRatio: 2.1, quickRatio: 1.5 });
    expect(doc.currentRatio).toBe(2.1);
    expect(doc.quickRatio).toBe(1.5);
  });
});

// ── 7. KPIThreshold ──────────────────────────────────────────────────────────
describe('KPIThreshold', () => {
  const KT = () => require('../models/KPIThreshold');

  it('creates threshold', async () => {
    const doc = await KT().create({ kpiName: 'Current Ratio', metric: 'currentRatio', unit: 'x', warningMin: 1.5, criticalMin: 1.0 });
    expect(doc.kpiName).toBe('Current Ratio');
    expect(doc.warningMin).toBe(1.5);
    expect(doc.criticalMin).toBe(1.0);
  });

  it('defaults isActive to true', async () => {
    const doc = await KT().create({ kpiName: 'Gross Margin', metric: 'grossMargin', unit: '%' });
    expect(doc.isActive).toBe(true);
  });
});

// ── 8. ConsolidationGroup ────────────────────────────────────────────────────
describe('ConsolidationGroup', () => {
  const CG = () => require('../models/ConsolidationGroup');

  it('creates with required fields', async () => {
    const doc = await CG().create({ groupName: 'Metro Group', currency: 'INR' });
    expect(doc.groupName).toBe('Metro Group');
    expect(doc.groupCode).toMatch(/^CG-/);
    expect(doc.isActive).toBe(true);
  });

  it('auto-generates groupCode', async () => {
    const a = await CG().create({ groupName: 'A', currency: 'INR' });
    const b = await CG().create({ groupName: 'B', currency: 'USD' });
    expect(a.groupCode).not.toBe(b.groupCode);
  });

  it('rejects missing groupName', async () => {
    await expect(CG().create({ currency: 'INR' })).rejects.toThrow();
  });
});

// ── 9. ConsolidationCompany ──────────────────────────────────────────────────
describe('ConsolidationCompany', () => {
  const CC = () => require('../models/ConsolidationCompany');
  const CG = () => require('../models/ConsolidationGroup');

  it('creates with required fields', async () => {
    const group = await CG().create({ groupName: 'Metro', currency: 'INR' });
    const doc = await CC().create({ group: group._id, companyName: 'Metro Delhi', entityType: 'branch' });
    expect(doc.companyName).toBe('Metro Delhi');
    expect(doc.entityType).toBe('branch');
    expect(doc.companyCode).toMatch(/^CC-/);
  });

  it('rejects missing group', async () => {
    await expect(CC().create({ companyName: 'Orphan', entityType: 'branch' })).rejects.toThrow();
  });

  it('rejects invalid entityType', async () => {
    const group = await CG().create({ groupName: 'MG2', currency: 'INR' });
    await expect(CC().create({ group: group._id, companyName: 'X', entityType: 'invalid' })).rejects.toThrow();
  });
});

// ── 10. InterCompanyTransaction ──────────────────────────────────────────────
describe('InterCompanyTransaction', () => {
  const ICT = () => require('../models/InterCompanyTransaction');
  const CC  = () => require('../models/ConsolidationCompany');
  const CG  = () => require('../models/ConsolidationGroup');

  it('creates IC transaction', async () => {
    const group = await CG().create({ groupName: 'ICT Group', currency: 'INR' });
    const co1 = await CC().create({ group: group._id, companyName: 'Metro Delhi', entityType: 'branch' });
    const co2 = await CC().create({ group: group._id, companyName: 'Metro Mumbai', entityType: 'branch' });
    const doc = await ICT().create({ fromCompany: co1._id, toCompany: co2._id, transactionType: 'sale', amount: 500000, currency: 'INR', transactionDate: new Date() });
    expect(doc.transactionType).toBe('sale');
    expect(doc.status).toBe('pending');
    expect(doc.txNumber).toMatch(/^ICT-/);
  });

  it('rejects invalid transactionType', async () => {
    const group = await CG().create({ groupName: 'ICT2', currency: 'INR' });
    const co1 = await CC().create({ group: group._id, companyName: 'A', entityType: 'branch' });
    const co2 = await CC().create({ group: group._id, companyName: 'B', entityType: 'branch' });
    await expect(ICT().create({ fromCompany: co1._id, toCompany: co2._id, transactionType: 'interco_bad', amount: 100, currency: 'INR', transactionDate: new Date() })).rejects.toThrow();
  });

  it('allows status: matched', async () => {
    const group = await CG().create({ groupName: 'ICT3', currency: 'INR' });
    const co1 = await CC().create({ group: group._id, companyName: 'C', entityType: 'branch' });
    const co2 = await CC().create({ group: group._id, companyName: 'D', entityType: 'branch' });
    const doc = await ICT().create({ fromCompany: co1._id, toCompany: co2._id, transactionType: 'loan', amount: 100, currency: 'INR', transactionDate: new Date() });
    doc.status = 'matched';
    await doc.save();
    expect(doc.status).toBe('matched');
  });
});

// ── 11. EliminationEntry ─────────────────────────────────────────────────────
describe('EliminationEntry', () => {
  const EE = () => require('../models/EliminationEntry');
  const CG = () => require('../models/ConsolidationGroup');

  it('creates elimination entry', async () => {
    const group = await CG().create({ groupName: 'EE Group', consolidationCurrency: 'INR' });
    const doc = await EE().create({ consolidationGroup: group._id, period: '2025-06', amount: 500000, description: 'Interco elimination' });
    expect(doc.eliminationNumber).toMatch(/^ELIM-/);
    expect(doc.period).toBe('2025-06');
    expect(doc.amount).toBe(500000);
  });

  it('rejects missing consolidationGroup', async () => {
    await expect(EE().create({ period: '2025-06', amount: 100 })).rejects.toThrow();
  });
});

// ── 12. FinancialSnapshot ─────────────────────────────────────────────────────
describe('FinancialSnapshot', () => {
  const FS = () => require('../models/FinancialSnapshot');

  it('creates snapshot', async () => {
    const doc = await FS().create({ asOfDate: new Date(), period: '2025-06', revenue: 10000000, totalAssets: 50000000 });
    expect(doc.period).toBe('2025-06');
    expect(doc.snapshotNumber).toMatch(/^SNAP-/);
    expect(doc.revenue).toBe(10000000);
  });

  it('auto-generates snapshotNumber', async () => {
    const a = await FS().create({ asOfDate: new Date(), period: '2025-06', revenue: 1000 });
    const b = await FS().create({ asOfDate: new Date(), period: '2025-07', revenue: 2000 });
    expect(a.snapshotNumber).not.toBe(b.snapshotNumber);
  });

  it('rejects missing asOfDate', async () => {
    await expect(FS().create({ period: '2025-08', revenue: 0 })).rejects.toThrow();
  });
});

// ── 13. FinancialReport ──────────────────────────────────────────────────────
describe('FinancialReport', () => {
  const FR = () => require('../models/FinancialReport');

  it('creates report', async () => {
    const doc = await FR().create({ reportName: 'Q1 Balance Sheet', reportType: 'balance_sheet', period: '2025-Q1' });
    expect(doc.reportName).toBe('Q1 Balance Sheet');
    expect(doc.reportNumber).toMatch(/^RPT-/);
    expect(doc.status).toBe('draft');
  });

  it('rejects invalid reportType', async () => {
    await expect(FR().create({ reportName: 'X', reportType: 'invalid_type', period: '2025-Q1' })).rejects.toThrow();
  });

  it('rejects missing reportName', async () => {
    await expect(FR().create({ reportType: 'pnl', period: '2025-Q1' })).rejects.toThrow();
  });

  it('stores reportType: executive_board', async () => {
    const doc = await FR().create({ reportName: 'Board Pack', reportType: 'executive_board', period: '2025-Q2' });
    expect(doc.reportType).toBe('executive_board');
  });
});

// ── 14. VarianceAnalysis ─────────────────────────────────────────────────────
describe('VarianceAnalysis', () => {
  const VA = () => require('../models/VarianceAnalysis');

  it('creates variance analysis', async () => {
    const doc = await VA().create({ analysisType: 'budget_vs_actual', period: '2025-Q1', actualRevenue: 10000000, budgetRevenue: 12000000 });
    expect(doc.analysisType).toBe('budget_vs_actual');
    expect(doc.analysisNumber).toMatch(/^VAR-/);
  });

  it('rejects invalid analysisType', async () => {
    await expect(VA().create({ analysisType: 'invalid', period: '2025-Q1' })).rejects.toThrow();
  });

  it('stores actual vs budget fields', async () => {
    const doc = await VA().create({ analysisType: 'yoy', period: '2025-06', actualRevenue: 5000000, budgetRevenue: 4500000 });
    expect(doc.actualRevenue).toBe(5000000);
    expect(doc.budgetRevenue).toBe(4500000);
  });

  it('has overallStatus default on_track', async () => {
    const doc = await VA().create({ analysisType: 'period_vs_period', period: '2025-07' });
    expect(doc.overallStatus).toBe('on_track');
  });
});

// ── 15. CashFlowStatement ────────────────────────────────────────────────────
describe('CashFlowStatement', () => {
  const CFS = () => require('../models/CashFlowStatement');

  it('creates statement', async () => {
    const doc = await CFS().create({ period: '2025-06', openingCash: 5000000, netIncome: 1200000, depreciation: 300000, capex: 800000 });
    expect(doc.period).toBe('2025-06');
    expect(doc.statementNumber).toMatch(/^CFS-/);
    expect(doc.status).toBe('draft');
  });

  it('auto-generates statementNumber', async () => {
    const a = await CFS().create({ period: '2025-05', openingCash: 100 });
    const b = await CFS().create({ period: '2025-06', openingCash: 200 });
    expect(a.statementNumber).not.toBe(b.statementNumber);
  });

  it('stores cash components', async () => {
    const doc = await CFS().create({ period: '2025-07', openingCash: 2000000, netIncome: 500000, depreciation: 100000, debtBorrowed: 1000000, dividendsPaid: 200000 });
    expect(doc.netIncome).toBe(500000);
    expect(doc.debtBorrowed).toBe(1000000);
  });

  it('status can be finalized', async () => {
    const doc = await CFS().create({ period: '2025-08', openingCash: 100 });
    doc.status = 'final';
    await doc.save();
    expect(doc.status).toBe('final');
  });
});

// ── 16. ProfitabilityAnalysis ────────────────────────────────────────────────
describe('ProfitabilityAnalysis', () => {
  const PA = () => require('../models/ProfitabilityAnalysis');

  it('creates product profitability', async () => {
    const doc = await PA().create({ analysisType: 'product', period: '2025-06', entityName: 'AC Unit 1.5T', revenue: 5000000, cogs: 3000000 });
    expect(doc.analysisType).toBe('product');
    expect(doc.analysisNumber).toMatch(/^PROF-/);
    expect(doc.entityName).toBe('AC Unit 1.5T');
  });

  it('creates customer profitability', async () => {
    const doc = await PA().create({ analysisType: 'customer', period: '2025-06', entityName: 'TCS', revenue: 2000000 });
    expect(doc.analysisType).toBe('customer');
  });

  it('rejects invalid analysisType', async () => {
    await expect(PA().create({ analysisType: 'invalid', period: '2025-06', entityName: 'X', revenue: 0 })).rejects.toThrow();
  });

  it('stores profitability fields', async () => {
    const doc = await PA().create({ analysisType: 'dealer', period: '2025-07', entityName: 'Dealer A', revenue: 3000000, cogs: 2000000, directExpenses: 200000 });
    expect(doc.revenue).toBe(3000000);
    expect(doc.directExpenses).toBe(200000);
  });
});

// ── 17. FinancialAlert ──────────────────────────────────────────────────────
describe('FinancialAlert', () => {
  const FA = () => require('../models/FinancialAlert');

  it('creates alert', async () => {
    const doc = await FA().create({ title: 'Low Cash Warning', alertType: 'low_cash', severity: 'high', message: 'Cash below threshold', threshold: 1000000, actualValue: 750000 });
    expect(doc.title).toBe('Low Cash Warning');
    expect(doc.alertType).toBe('low_cash');
    expect(doc.alertCode).toMatch(/^FALERT-/);
    expect(doc.status).toBe('active');
  });

  it('rejects missing title', async () => {
    await expect(FA().create({ alertType: 'low_cash', severity: 'low', message: 'x' })).rejects.toThrow();
  });

  it('rejects invalid alertType', async () => {
    await expect(FA().create({ title: 'X', alertType: 'unknown', severity: 'low', message: 'x' })).rejects.toThrow();
  });

  it('rejects invalid severity', async () => {
    await expect(FA().create({ title: 'X', alertType: 'low_cash', severity: 'super_critical', message: 'x' })).rejects.toThrow();
  });

  it('acknowledges alert', async () => {
    const doc = await FA().create({ title: 'Test', alertType: 'budget_overrun', severity: 'medium', message: 'Budget exceeded' });
    doc.status = 'acknowledged';
    await doc.save();
    expect(doc.status).toBe('acknowledged');
  });

  it('resolves alert', async () => {
    const doc = await FA().create({ title: 'Res', alertType: 'kpi_breach', severity: 'critical', message: 'KPI critical' });
    doc.status = 'resolved';
    await doc.save();
    expect(doc.status).toBe('resolved');
  });
});

// ── 18. BoardReport ──────────────────────────────────────────────────────────
describe('BoardReport', () => {
  const BR = () => require('../models/BoardReport');

  it('creates board report', async () => {
    const doc = await BR().create({ reportTitle: 'Q1 2025 Board Pack', boardDate: new Date('2025-04-15'), period: '2025-Q1' });
    expect(doc.reportTitle).toBe('Q1 2025 Board Pack');
    expect(doc.reportNumber).toMatch(/^BOARD-/);
    expect(doc.status).toBe('draft');
  });

  it('rejects missing boardDate', async () => {
    await expect(BR().create({ reportTitle: 'X', period: '2025-Q1' })).rejects.toThrow();
  });

  it('rejects missing reportTitle', async () => {
    await expect(BR().create({ boardDate: new Date(), period: '2025-Q1' })).rejects.toThrow();
  });

  it('stores highlights, risks, opportunities', async () => {
    const doc = await BR().create({ reportTitle: 'Test', boardDate: new Date(), period: '2025-Q2', keyHighlights: ['Revenue up 20%', 'New product launch'], keyRisks: ['Supply chain'], keyOpportunities: ['Export growth'] });
    expect(doc.keyHighlights).toHaveLength(2);
    expect(doc.keyRisks[0]).toBe('Supply chain');
  });

  it('stores financial deltas', async () => {
    const doc = await BR().create({ reportTitle: 'Delta', boardDate: new Date(), period: '2025-Q3', revenue: 15000000, netProfit: 2000000, revenueVsBudget: 5.5, revenueYoY: 12.3 });
    expect(doc.revenue).toBe(15000000);
    expect(doc.revenueVsBudget).toBe(5.5);
    expect(doc.revenueYoY).toBe(12.3);
  });

  it('approves board report', async () => {
    const doc = await BR().create({ reportTitle: 'Appr', boardDate: new Date(), period: '2025-Q4' });
    doc.status = 'approved';
    await doc.save();
    expect(doc.status).toBe('approved');
  });
});

// ── 19. ExecutiveDashboardSetting ────────────────────────────────────────────
describe('ExecutiveDashboardSetting', () => {
  const EDS = () => require('../models/ExecutiveDashboardSetting');

  it('creates setting', async () => {
    const doc = await EDS().create({ settingKey: 'kpi_refresh_interval', settingValue: 300, category: 'refresh' });
    expect(doc.settingKey).toBe('kpi_refresh_interval');
    expect(doc.category).toBe('refresh');
    expect(doc.isActive).toBe(true);
  });

  it('rejects duplicate settingKey', async () => {
    await EDS().create({ settingKey: 'my_setting', settingValue: 1, category: 'display' });
    await expect(EDS().create({ settingKey: 'my_setting', settingValue: 2, category: 'display' })).rejects.toThrow();
  });

  it('rejects invalid category', async () => {
    await expect(EDS().create({ settingKey: 'bad_cat', settingValue: 1, category: 'invalid_cat' })).rejects.toThrow();
  });
});
