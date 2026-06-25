'use strict';
const FinancialKPI     = require('../models/FinancialKPI');
const FinancialAlert   = require('../models/FinancialAlert');
const FinancialSnapshot= require('../models/FinancialSnapshot');
const Budget           = require('../models/Budget');
const FinancialForecast= require('../models/FinancialForecast');
const CashFlowStatement= require('../models/CashFlowStatement');
const ProfitabilityAnalysis = require('../models/ProfitabilityAnalysis');
const GeneralLedger    = require('../models/GeneralLedger');
const BankAccount      = require('../models/BankAccount');
const AuditLog         = require('../models/AuditLog');
const { ok, serverError } = require('../utils/response');

// ── Dashboard Summary ─────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const { period } = req.query;
    const filter = period ? { period } : {};

    const [latestKPI, activeAlerts, recentSnapshots, budgetCount, forecastCount] = await Promise.all([
      FinancialKPI.findOne({ ...filter, isDeleted: false }).sort({ calculatedAt: -1 }),
      FinancialAlert.countDocuments({ status: 'active', isDeleted: false }),
      FinancialSnapshot.find({ isDeleted: false }).sort({ asOfDate: -1 }).limit(1),
      Budget.countDocuments({ status: { $in: ['approved','locked'] }, isDeleted: false }),
      FinancialForecast.countDocuments({ status: 'approved', isDeleted: false }),
    ]);

    const snapshot = recentSnapshots[0] || {};

    return ok(res, {
      kpis: latestKPI,
      summary: {
        revenue:       latestKPI?.revenue        || 0,
        grossProfit:   latestKPI?.grossProfit     || 0,
        netProfit:     latestKPI?.netProfit       || 0,
        ebitda:        latestKPI?.ebitda          || 0,
        cashBalance:   latestKPI?.cashBalance     || 0,
        workingCapital:latestKPI?.workingCapital  || 0,
        receivables:   snapshot.receivables       || 0,
        payables:      snapshot.payables          || 0,
        inventoryValue:snapshot.inventoryValue    || 0,
        bankBalance:   snapshot.bankBalance       || 0,
      },
      alerts:         activeAlerts,
      budgets:        budgetCount,
      forecasts:      forecastCount,
    });
  } catch (err) { return serverError(res, err); }
};

// ── Revenue Trend (12 months) ─────────────────────────────────────────────────
exports.getRevenueTrend = async (req, res) => {
  try {
    const kpis = await FinancialKPI.find({ isDeleted: false })
      .sort({ period: -1 }).limit(12)
      .select('period revenue grossProfit netProfit ebitda');
    return ok(res, kpis.reverse());
  } catch (err) { return serverError(res, err); }
};

// ── Cash Flow Chart ───────────────────────────────────────────────────────────
exports.getCashFlowChart = async (req, res) => {
  try {
    const statements = await CashFlowStatement.find({ isDeleted: false })
      .sort({ period: -1 }).limit(12)
      .select('period operatingActivities investingActivities financingActivities netCashFlow closingCash');
    return ok(res, statements.reverse());
  } catch (err) { return serverError(res, err); }
};

// ── Budget vs Actual ──────────────────────────────────────────────────────────
exports.getBudgetVsActual = async (req, res) => {
  try {
    const budgets = await Budget.find({ isDeleted: false, status: { $in: ['approved','locked'] } })
      .sort({ createdAt: -1 }).limit(12)
      .select('budgetName period totalBudget totalActual variance variancePct');
    return ok(res, budgets);
  } catch (err) { return serverError(res, err); }
};

// ── Expense Breakdown ─────────────────────────────────────────────────────────
exports.getExpenseBreakdown = async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { isDeleted: false };
    if (period) filter.period = period;
    const analyses = await ProfitabilityAnalysis.find(filter)
      .sort({ netProfit: -1 }).limit(10)
      .select('analysisType entityName revenue cogs grossMargin netProfit netMargin period');
    return ok(res, analyses);
  } catch (err) { return serverError(res, err); }
};

// ── KPI Trend ─────────────────────────────────────────────────────────────────
exports.getKPITrend = async (req, res) => {
  try {
    const kpis = await FinancialKPI.find({ isDeleted: false })
      .sort({ period: -1 }).limit(12)
      .select('period operatingMargin grossMargin netMargin currentRatio quickRatio dso dpo inventoryTurnover roa roe');
    return ok(res, kpis.reverse());
  } catch (err) { return serverError(res, err); }
};

// ── Alert Summary ─────────────────────────────────────────────────────────────
exports.getAlertSummary = async (req, res) => {
  try {
    const alerts = await FinancialAlert.find({ isDeleted: false, status: 'active' })
      .sort({ severity: 1, createdAt: -1 }).limit(20);
    const counts = await FinancialAlert.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    return ok(res, { alerts, counts });
  } catch (err) { return serverError(res, err); }
};
