import axios from 'axios';

const BASE = '/api/admin/portfolio';

// ── Dashboards ───────────────────────────────────────────────────────────────
export const fetchPortfolioDashboard = () => axios.get(`${BASE}/dashboard`);
export const fetchExecutiveDashboard = () => axios.get(`${BASE}/executive-dashboard`);

// ── Portfolios ───────────────────────────────────────────────────────────────
export const fetchPortfolios = (params) => axios.get(BASE, { params });
export const createPortfolio = (data) => axios.post(BASE, data);
export const fetchPortfolio = (id) => axios.get(`${BASE}/${id}`);
export const updatePortfolio = (id, data) => axios.put(`${BASE}/${id}`, data);
export const deletePortfolio = (id) => axios.delete(`${BASE}/${id}`);
export const updatePortfolioStatus = (id, status) => axios.patch(`${BASE}/${id}/status`, { status });

// ── Programs ─────────────────────────────────────────────────────────────────
export const fetchPrograms = (params) => axios.get(`${BASE}/programs`, { params });
export const createProgram = (data) => axios.post(`${BASE}/programs`, data);
export const fetchProgram = (id) => axios.get(`${BASE}/programs/${id}`);
export const updateProgram = (id, data) => axios.put(`${BASE}/programs/${id}`, data);
export const deleteProgram = (id) => axios.delete(`${BASE}/programs/${id}`);

// ── Program ↔ Project mapping ────────────────────────────────────────────────
export const fetchProgramProjects = (params) => axios.get(`${BASE}/program-projects`, { params });
export const mapProject = (data) => axios.post(`${BASE}/program-projects`, data);
export const updateProgramProject = (id, data) => axios.put(`${BASE}/program-projects/${id}`, data);
export const unmapProject = (id) => axios.delete(`${BASE}/program-projects/${id}`);

// ── Strategic Initiatives ────────────────────────────────────────────────────
export const fetchInitiatives = (params) => axios.get(`${BASE}/initiatives`, { params });
export const createInitiative = (data) => axios.post(`${BASE}/initiatives`, data);
export const updateInitiative = (id, data) => axios.put(`${BASE}/initiatives/${id}`, data);
export const deleteInitiative = (id) => axios.delete(`${BASE}/initiatives/${id}`);

// ── KPIs ─────────────────────────────────────────────────────────────────────
export const fetchPortfolioKPIs = (id) => axios.get(`${BASE}/${id}/kpis`);
export const createPortfolioKPI = (id, data) => axios.post(`${BASE}/${id}/kpis`, data);
export const updatePortfolioKPI = (kpiId, data) => axios.put(`${BASE}/kpis/${kpiId}`, data);
export const deletePortfolioKPI = (kpiId) => axios.delete(`${BASE}/kpis/${kpiId}`);

// ── Budget / Forecast / Benefits / Financial ─────────────────────────────────
export const fetchPortfolioBudget = (id) => axios.get(`${BASE}/${id}/budget`);
export const upsertPortfolioBudget = (id, data) => axios.put(`${BASE}/${id}/budget`, data);
export const fetchForecasts = (id) => axios.get(`${BASE}/${id}/forecast`);
export const createForecast = (id, data) => axios.post(`${BASE}/${id}/forecast`, data);
export const updateForecast = (fid, data) => axios.put(`${BASE}/forecast/${fid}`, data);
export const deleteForecast = (fid) => axios.delete(`${BASE}/forecast/${fid}`);
export const fetchBenefits = (id) => axios.get(`${BASE}/${id}/benefits`);
export const createBenefit = (id, data) => axios.post(`${BASE}/${id}/benefits`, data);
export const updateBenefit = (bid, data) => axios.put(`${BASE}/benefits/${bid}`, data);
export const deleteBenefit = (bid) => axios.delete(`${BASE}/benefits/${bid}`);
export const fetchFinancialSummary = (id) => axios.get(`${BASE}/${id}/financial-summary`);

// ── Risks ────────────────────────────────────────────────────────────────────
export const fetchPortfolioRisks = (id, params) => axios.get(`${BASE}/${id}/risks`, { params });
export const createPortfolioRisk = (id, data) => axios.post(`${BASE}/${id}/risks`, data);
export const updatePortfolioRisk = (rid, data) => axios.put(`${BASE}/risks/${rid}`, data);
export const deletePortfolioRisk = (rid) => axios.delete(`${BASE}/risks/${rid}`);

// ── Governance ───────────────────────────────────────────────────────────────
export const fetchGovernance = (id) => axios.get(`${BASE}/${id}/governance`);
export const createGovernance = (id, data) => axios.post(`${BASE}/${id}/governance`, data);
export const updateGovernance = (gid, data) => axios.put(`${BASE}/governance/${gid}`, data);
export const deleteGovernance = (gid) => axios.delete(`${BASE}/governance/${gid}`);

// ── Approvals ────────────────────────────────────────────────────────────────
export const fetchApprovals = (id, params) => axios.get(`${BASE}/${id}/approvals`, { params });
export const createApproval = (id, data) => axios.post(`${BASE}/${id}/approvals`, data);
export const decideApproval = (aid, data) => axios.patch(`${BASE}/approvals/${aid}/decide`, data);
export const deleteApproval = (aid) => axios.delete(`${BASE}/approvals/${aid}`);

// ── Roadmap ──────────────────────────────────────────────────────────────────
export const fetchRoadmap = (id) => axios.get(`${BASE}/${id}/roadmap`);
export const createRoadmapItem = (id, data) => axios.post(`${BASE}/${id}/roadmap`, data);
export const updateRoadmapItem = (rid, data) => axios.put(`${BASE}/roadmap/${rid}`, data);
export const deleteRoadmapItem = (rid) => axios.delete(`${BASE}/roadmap/${rid}`);

// ── Portfolio Milestones ─────────────────────────────────────────────────────
export const fetchPortfolioMilestones = (id) => axios.get(`${BASE}/${id}/milestones`);
export const createPortfolioMilestone = (id, data) => axios.post(`${BASE}/${id}/milestones`, data);
export const updatePortfolioMilestone = (mid, data) => axios.put(`${BASE}/milestones/${mid}`, data);
export const deletePortfolioMilestone = (mid) => axios.delete(`${BASE}/milestones/${mid}`);

// ── Status Reports ───────────────────────────────────────────────────────────
export const fetchStatusReports = (id) => axios.get(`${BASE}/${id}/status-reports`);
export const createStatusReport = (id, data) => axios.post(`${BASE}/${id}/status-reports`, data);
export const deleteStatusReport = (sid) => axios.delete(`${BASE}/status-reports/${sid}`);
export const fetchPortfolioStatusReport = (id) => axios.get(`${BASE}/${id}/status-report`);

// ── Resource Capacity Planning ───────────────────────────────────────────────
export const fetchCapacity = (params) => axios.get(`${BASE}/resources/capacity`, { params });
export const createCapacity = (data) => axios.post(`${BASE}/resources/capacity`, data);
export const updateCapacity = (id, data) => axios.put(`${BASE}/resources/capacity/${id}`, data);
export const deleteCapacity = (id) => axios.delete(`${BASE}/resources/capacity/${id}`);
export const fetchDemand = (params) => axios.get(`${BASE}/resources/demand`, { params });
export const createDemand = (data) => axios.post(`${BASE}/resources/demand`, data);
export const updateDemand = (id, data) => axios.put(`${BASE}/resources/demand/${id}`, data);
export const deleteDemand = (id) => axios.delete(`${BASE}/resources/demand/${id}`);
export const fetchDemandVsCapacity = (params) => axios.get(`${BASE}/resources/demand-vs-capacity`, { params });
export const fetchUtilization = (params) => axios.get(`${BASE}/resources/utilization`, { params });
export const fetchConflicts = (params) => axios.get(`${BASE}/resources/conflicts`, { params });
export const fetchHeatmap = (params) => axios.get(`${BASE}/resources/heatmap`, { params });

// ── Reports ──────────────────────────────────────────────────────────────────
export const fetchExecutiveReport = () => axios.get(`${BASE}/reports/executive`);
export const fetchResourceReport = (params) => axios.get(`${BASE}/reports/resource`, { params });
export const fetchFinancialReport = (params) => axios.get(`${BASE}/reports/financial`, { params });
export const fetchBenefitsReport = (params) => axios.get(`${BASE}/reports/benefits`, { params });
export const fetchRiskSummary = (params) => axios.get(`${BASE}/reports/risk`, { params });
