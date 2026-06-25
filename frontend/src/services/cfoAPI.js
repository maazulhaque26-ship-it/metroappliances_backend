import axios from 'axios';
const BASE = '/api/admin/cfo';

// ── CFO Dashboard ─────────────────────────────────────────────────────────────
export const fetchCFODashboard      = ()         => axios.get(`${BASE}/dashboard`);
export const fetchRevenueTrend      = ()         => axios.get(`${BASE}/dashboard/revenue-trend`);
export const fetchCashFlowChart     = ()         => axios.get(`${BASE}/dashboard/cash-flow`);
export const fetchBudgetVsActual    = ()         => axios.get(`${BASE}/dashboard/budget-actual`);
export const fetchExpenseBreakdown  = ()         => axios.get(`${BASE}/dashboard/expense-breakdown`);
export const fetchKPITrend          = ()         => axios.get(`${BASE}/dashboard/kpi-trend`);
export const fetchDashboardAlerts   = ()         => axios.get(`${BASE}/dashboard/alerts`);

// ── Budgets ───────────────────────────────────────────────────────────────────
export const fetchBudgets           = (params)   => axios.get(`${BASE}/budgets`, { params });
export const fetchBudget            = (id)       => axios.get(`${BASE}/budgets/${id}`);
export const fetchBudgetVariance    = (params)   => axios.get(`${BASE}/budgets/variance`, { params });
export const createBudget           = (data)     => axios.post(`${BASE}/budgets`, data);
export const updateBudget           = (id, data) => axios.put(`${BASE}/budgets/${id}`, data);
export const deleteBudget           = (id)       => axios.delete(`${BASE}/budgets/${id}`);
export const approveBudget          = (id)       => axios.patch(`${BASE}/budgets/${id}/approve`);
export const lockBudget             = (id)       => axios.patch(`${BASE}/budgets/${id}/lock`);
export const reviseBudget           = (id, data) => axios.post(`${BASE}/budgets/${id}/revise`, data);

// ── Budget Lines ──────────────────────────────────────────────────────────────
export const fetchBudgetLines       = (id)       => axios.get(`${BASE}/budgets/${id}/lines`);
export const createBudgetLine       = (id, data) => axios.post(`${BASE}/budgets/${id}/lines`, data);
export const updateBudgetLine       = (id, lid, data) => axios.put(`${BASE}/budgets/${id}/lines/${lid}`, data);
export const deleteBudgetLine       = (id, lid)  => axios.delete(`${BASE}/budgets/${id}/lines/${lid}`);

// ── Budget Scenarios ──────────────────────────────────────────────────────────
export const fetchBudgetScenarios   = ()         => axios.get(`${BASE}/budget-scenarios`);
export const createBudgetScenario   = (data)     => axios.post(`${BASE}/budget-scenarios`, data);
export const updateBudgetScenario   = (id, data) => axios.put(`${BASE}/budget-scenarios/${id}`, data);
export const deleteBudgetScenario   = (id)       => axios.delete(`${BASE}/budget-scenarios/${id}`);

// ── Financial Forecasts ───────────────────────────────────────────────────────
export const fetchForecasts         = (params)   => axios.get(`${BASE}/forecasts`, { params });
export const fetchForecast          = (id)       => axios.get(`${BASE}/forecasts/${id}`);
export const fetchForecastVariance  = ()         => axios.get(`${BASE}/forecasts/variance`);
export const createForecast         = (data)     => axios.post(`${BASE}/forecasts`, data);
export const updateForecast         = (id, data) => axios.put(`${BASE}/forecasts/${id}`, data);
export const deleteForecast         = (id)       => axios.delete(`${BASE}/forecasts/${id}`);
export const approveForecast        = (id)       => axios.patch(`${BASE}/forecasts/${id}/approve`);

// ── Forecast Lines ────────────────────────────────────────────────────────────
export const fetchForecastLines     = (id)       => axios.get(`${BASE}/forecasts/${id}/lines`);
export const createForecastLine     = (id, data) => axios.post(`${BASE}/forecasts/${id}/lines`, data);
export const updateForecastLine     = (id, lid, data) => axios.put(`${BASE}/forecasts/${id}/lines/${lid}`, data);
export const deleteForecastLine     = (id, lid)  => axios.delete(`${BASE}/forecasts/${id}/lines/${lid}`);

// ── KPIs ──────────────────────────────────────────────────────────────────────
export const fetchKPIs              = (params)   => axios.get(`${BASE}/kpis`, { params });
export const fetchKPI               = (id)       => axios.get(`${BASE}/kpis/${id}`);
export const fetchKPITrendData      = ()         => axios.get(`${BASE}/kpis/trend`);
export const createKPI              = (data)     => axios.post(`${BASE}/kpis`, data);
export const calculateKPIs          = (data)     => axios.post(`${BASE}/kpis/calculate`, data);
export const deleteKPI              = (id)       => axios.delete(`${BASE}/kpis/${id}`);

// ── KPI Thresholds ────────────────────────────────────────────────────────────
export const fetchKPIThresholds     = ()         => axios.get(`${BASE}/kpi-thresholds`);
export const createKPIThreshold     = (data)     => axios.post(`${BASE}/kpi-thresholds`, data);
export const updateKPIThreshold     = (id, data) => axios.put(`${BASE}/kpi-thresholds/${id}`, data);
export const deleteKPIThreshold     = (id)       => axios.delete(`${BASE}/kpi-thresholds/${id}`);

// ── Financial Alerts ──────────────────────────────────────────────────────────
export const fetchFinancialAlerts   = (params)   => axios.get(`${BASE}/alerts`, { params });
export const createFinancialAlert   = (data)     => axios.post(`${BASE}/alerts`, data);
export const acknowledgeAlert       = (id)       => axios.patch(`${BASE}/alerts/${id}/acknowledge`);
export const resolveAlert           = (id)       => axios.patch(`${BASE}/alerts/${id}/resolve`);
export const deleteFinancialAlert   = (id)       => axios.delete(`${BASE}/alerts/${id}`);

// ── Executive Dashboard Settings ──────────────────────────────────────────────
export const fetchCFOSettings       = ()         => axios.get(`${BASE}/settings`);
export const upsertCFOSetting       = (data)     => axios.post(`${BASE}/settings`, data);
export const deleteCFOSetting       = (id)       => axios.delete(`${BASE}/settings/${id}`);

// ── Consolidation Groups ──────────────────────────────────────────────────────
export const fetchConsolidationGroups   = ()         => axios.get(`${BASE}/consolidation/groups`);
export const createConsolidationGroup   = (data)     => axios.post(`${BASE}/consolidation/groups`, data);
export const updateConsolidationGroup   = (id, data) => axios.put(`${BASE}/consolidation/groups/${id}`, data);
export const deleteConsolidationGroup   = (id)       => axios.delete(`${BASE}/consolidation/groups/${id}`);

// ── Consolidation Companies ───────────────────────────────────────────────────
export const fetchConsolidationCompanies  = (params)   => axios.get(`${BASE}/consolidation/companies`, { params });
export const createConsolidationCompany   = (data)     => axios.post(`${BASE}/consolidation/companies`, data);
export const updateConsolidationCompany   = (id, data) => axios.put(`${BASE}/consolidation/companies/${id}`, data);
export const deleteConsolidationCompany   = (id)       => axios.delete(`${BASE}/consolidation/companies/${id}`);

// ── Inter-Company Transactions ────────────────────────────────────────────────
export const fetchICTransactions    = (params)   => axios.get(`${BASE}/consolidation/ic-transactions`, { params });
export const createICTransaction    = (data)     => axios.post(`${BASE}/consolidation/ic-transactions`, data);
export const updateICTransaction    = (id, data) => axios.put(`${BASE}/consolidation/ic-transactions/${id}`, data);
export const deleteICTransaction    = (id)       => axios.delete(`${BASE}/consolidation/ic-transactions/${id}`);

// ── Elimination Entries ───────────────────────────────────────────────────────
export const fetchEliminations      = (params)   => axios.get(`${BASE}/consolidation/eliminations`, { params });
export const createElimination      = (data)     => axios.post(`${BASE}/consolidation/eliminations`, data);
export const deleteElimination      = (id)       => axios.delete(`${BASE}/consolidation/eliminations/${id}`);

// ── Consolidated Financials ───────────────────────────────────────────────────
export const fetchConsolidatedPnL          = (params) => axios.get(`${BASE}/consolidation/pnl`, { params });
export const fetchConsolidatedBalanceSheet = (params) => axios.get(`${BASE}/consolidation/balance-sheet`, { params });

// ── Financial Snapshots ───────────────────────────────────────────────────────
export const fetchSnapshots         = (params)   => axios.get(`${BASE}/snapshots`, { params });
export const createSnapshot         = (data)     => axios.post(`${BASE}/snapshots`, data);

// ── Cash Flow Statements ──────────────────────────────────────────────────────
export const fetchCashFlowStatements = (params)  => axios.get(`${BASE}/cash-flow`, { params });
export const fetchCashFlowStatement  = (id)      => axios.get(`${BASE}/cash-flow/${id}`);
export const fetchCashPosition       = ()        => axios.get(`${BASE}/cash-flow/position`);
export const fetchLiquidityPosition  = ()        => axios.get(`${BASE}/cash-flow/liquidity`);
export const fetchFreeCashFlow       = ()        => axios.get(`${BASE}/cash-flow/free-cash-flow`);
export const createCashFlowStatement = (data)    => axios.post(`${BASE}/cash-flow`, data);
export const updateCashFlowStatement = (id, data)=> axios.put(`${BASE}/cash-flow/${id}`, data);
export const finalizeCashFlowStatement = (id)    => axios.patch(`${BASE}/cash-flow/${id}/finalize`);
export const deleteCashFlowStatement = (id)      => axios.delete(`${BASE}/cash-flow/${id}`);

// ── Profitability ─────────────────────────────────────────────────────────────
export const fetchProfitabilityAnalyses = (params)   => axios.get(`${BASE}/profitability`, { params });
export const fetchProfitabilityAnalysis = (id)       => axios.get(`${BASE}/profitability/${id}`);
export const fetchProfitabilitySummary  = (params)   => axios.get(`${BASE}/profitability/summary`, { params });
export const fetchProductProfitability  = (params)   => axios.get(`${BASE}/profitability/product`, { params });
export const fetchCustomerProfitability = (params)   => axios.get(`${BASE}/profitability/customer`, { params });
export const fetchDealerProfitability   = (params)   => axios.get(`${BASE}/profitability/dealer`, { params });
export const fetchFactoryProfitability  = (params)   => axios.get(`${BASE}/profitability/factory`, { params });
export const fetchServiceProfitability  = (params)   => axios.get(`${BASE}/profitability/service`, { params });
export const createProfitabilityAnalysis= (data)     => axios.post(`${BASE}/profitability`, data);
export const updateProfitabilityAnalysis= (id, data) => axios.put(`${BASE}/profitability/${id}`, data);
export const deleteProfitabilityAnalysis= (id)       => axios.delete(`${BASE}/profitability/${id}`);

// ── Financial Reports ─────────────────────────────────────────────────────────
export const fetchFinancialReports  = (params)   => axios.get(`${BASE}/reports`, { params });
export const fetchFinancialReport   = (id)       => axios.get(`${BASE}/reports/${id}`);
export const createFinancialReport  = (data)     => axios.post(`${BASE}/reports`, data);
export const updateFinancialReport  = (id, data) => axios.put(`${BASE}/reports/${id}`, data);
export const approveFinancialReport = (id)       => axios.patch(`${BASE}/reports/${id}/approve`);
export const deleteFinancialReport  = (id)       => axios.delete(`${BASE}/reports/${id}`);

// ── Generated Reports ─────────────────────────────────────────────────────────
export const fetchBalanceSheet          = (params) => axios.get(`${BASE}/reports/balance-sheet`, { params });
export const fetchProfitLoss            = (params) => axios.get(`${BASE}/reports/profit-loss`, { params });
export const fetchCFOCashFlowReport     = (params) => axios.get(`${BASE}/reports/cash-flow`, { params });
export const fetchTrialBalance          = (params) => axios.get(`${BASE}/reports/trial-balance`, { params });
export const fetchBudgetVarianceReport  = (params) => axios.get(`${BASE}/reports/budget-variance`, { params });
export const fetchForecastVarianceReport= (params) => axios.get(`${BASE}/reports/forecast-variance`, { params });
export const fetchExecutiveBoardPack    = (params) => axios.get(`${BASE}/reports/executive-board-pack`, { params });
export const fetchMonthlyFinancialPack  = (params) => axios.get(`${BASE}/reports/monthly-pack`, { params });

// ── Variance Analysis ─────────────────────────────────────────────────────────
export const fetchVarianceAnalyses      = (params)   => axios.get(`${BASE}/variance`, { params });
export const createVarianceAnalysis     = (data)     => axios.post(`${BASE}/variance`, data);
export const updateVarianceAnalysis     = (id, data) => axios.put(`${BASE}/variance/${id}`, data);
export const deleteVarianceAnalysis     = (id)       => axios.delete(`${BASE}/variance/${id}`);

// ── Board Reports ─────────────────────────────────────────────────────────────
export const fetchBoardReports          = (params)   => axios.get(`${BASE}/board-reports`, { params });
export const fetchBoardReport           = (id)       => axios.get(`${BASE}/board-reports/${id}`);
export const createBoardReport          = (data)     => axios.post(`${BASE}/board-reports`, data);
export const updateBoardReport          = (id, data) => axios.put(`${BASE}/board-reports/${id}`, data);
export const approveBoardReport         = (id)       => axios.patch(`${BASE}/board-reports/${id}/approve`);
export const deleteBoardReport          = (id)       => axios.delete(`${BASE}/board-reports/${id}`);
