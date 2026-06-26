import axios from 'axios';
const BASE = '/api/admin/hr/payroll';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchPayrollDashboard = ()         => axios.get(`${BASE}/dashboard`);

// ── Payroll Periods ───────────────────────────────────────────────────────────
export const fetchPeriods    = (p)      => axios.get(`${BASE}/periods`, { params: p });
export const createPeriod    = (d)      => axios.post(`${BASE}/periods`, d);
export const fetchPeriod     = (id)     => axios.get(`${BASE}/periods/${id}`);
export const updatePeriod    = (id, d)  => axios.put(`${BASE}/periods/${id}`, d);
export const deletePeriod    = (id)     => axios.delete(`${BASE}/periods/${id}`);
export const closePeriod     = (id)     => axios.patch(`${BASE}/periods/${id}/close`);

// ── Payroll Runs ──────────────────────────────────────────────────────────────
export const fetchRuns         = (p)     => axios.get(`${BASE}/runs`, { params: p });
export const createRun         = (d)     => axios.post(`${BASE}/runs`, d);
export const fetchRun          = (id)    => axios.get(`${BASE}/runs/${id}`);
export const calculateRun      = (id)    => axios.patch(`${BASE}/runs/${id}/calculate`);
export const approveRun        = (id, d) => axios.patch(`${BASE}/runs/${id}/approve`, d);
export const postRun           = (id)    => axios.patch(`${BASE}/runs/${id}/post`);
export const payRun            = (id, d) => axios.patch(`${BASE}/runs/${id}/pay`, d);
export const fetchRunEmployees = (id, p) => axios.get(`${BASE}/runs/${id}/employees`, { params: p });

// ── Payroll Employees (individual entries) ────────────────────────────────────
export const fetchPayrollEmployee = (id)    => axios.get(`${BASE}/payroll-employees/${id}`);
export const addAdjustment        = (id, d) => axios.post(`${BASE}/payroll-employees/${id}/adjustments`, d);

// ── Salary Components ─────────────────────────────────────────────────────────
export const fetchComponents  = (p)     => axios.get(`${BASE}/components`, { params: p });
export const createComponent  = (d)     => axios.post(`${BASE}/components`, d);
export const fetchComponent   = (id)    => axios.get(`${BASE}/components/${id}`);
export const updateComponent  = (id, d) => axios.put(`${BASE}/components/${id}`, d);
export const deleteComponent  = (id)    => axios.delete(`${BASE}/components/${id}`);

// ── Salary Structures ─────────────────────────────────────────────────────────
export const fetchStructures  = (p)     => axios.get(`${BASE}/structures`, { params: p });
export const createStructure  = (d)     => axios.post(`${BASE}/structures`, d);
export const fetchStructure   = (id)    => axios.get(`${BASE}/structures/${id}`);
export const updateStructure  = (id, d) => axios.put(`${BASE}/structures/${id}`, d);
export const deleteStructure  = (id)    => axios.delete(`${BASE}/structures/${id}`);

// ── Employee Salary Assignments ───────────────────────────────────────────────
export const fetchEmployeeSalaries = (p)     => axios.get(`${BASE}/employee-salary`, { params: p });
export const assignEmployeeSalary  = (d)     => axios.post(`${BASE}/employee-salary`, d);
export const fetchEmployeeSalary   = (id)    => axios.get(`${BASE}/employee-salary/${id}`);
export const updateEmployeeSalary  = (id, d) => axios.put(`${BASE}/employee-salary/${id}`, d);
export const deleteEmployeeSalary  = (id)    => axios.delete(`${BASE}/employee-salary/${id}`);

// ── Payslips ──────────────────────────────────────────────────────────────────
export const fetchPayslips   = (p)   => axios.get(`${BASE}/payslips`, { params: p });
export const fetchPayslip    = (id)  => axios.get(`${BASE}/payslips/${id}`);
export const publishPayslip  = (id)  => axios.patch(`${BASE}/payslips/${id}/publish`);

// ── Bonuses ───────────────────────────────────────────────────────────────────
export const fetchBonuses    = (p)     => axios.get(`${BASE}/bonuses`, { params: p });
export const createBonus     = (d)     => axios.post(`${BASE}/bonuses`, d);
export const fetchBonus      = (id)    => axios.get(`${BASE}/bonuses/${id}`);
export const updateBonus     = (id, d) => axios.put(`${BASE}/bonuses/${id}`, d);
export const deleteBonus     = (id)    => axios.delete(`${BASE}/bonuses/${id}`);
export const approveBonus    = (id, d) => axios.patch(`${BASE}/bonuses/${id}/approve`, d);

// ── Incentives ────────────────────────────────────────────────────────────────
export const fetchIncentives   = (p)     => axios.get(`${BASE}/incentives`, { params: p });
export const createIncentive   = (d)     => axios.post(`${BASE}/incentives`, d);
export const fetchIncentive    = (id)    => axios.get(`${BASE}/incentives/${id}`);
export const updateIncentive   = (id, d) => axios.put(`${BASE}/incentives/${id}`, d);
export const approveIncentive  = (id, d) => axios.patch(`${BASE}/incentives/${id}/approve`, d);

// ── Overtime ──────────────────────────────────────────────────────────────────
export const fetchOvertime       = (p)     => axios.get(`${BASE}/overtime`, { params: p });
export const createOvertime      = (d)     => axios.post(`${BASE}/overtime`, d);
export const fetchOvertimeRecord = (id)    => axios.get(`${BASE}/overtime/${id}`);
export const updateOvertime      = (id, d) => axios.put(`${BASE}/overtime/${id}`, d);
export const approveOvertime     = (id, d) => axios.patch(`${BASE}/overtime/${id}/approve`, d);

// ── Loans ─────────────────────────────────────────────────────────────────────
export const fetchLoans      = (p)     => axios.get(`${BASE}/loans`, { params: p });
export const createLoan      = (d)     => axios.post(`${BASE}/loans`, d);
export const fetchLoan       = (id)    => axios.get(`${BASE}/loans/${id}`);
export const updateLoan      = (id, d) => axios.put(`${BASE}/loans/${id}`, d);
export const approveLoan     = (id, d) => axios.patch(`${BASE}/loans/${id}/approve`, d);
export const closeLoan       = (id)    => axios.patch(`${BASE}/loans/${id}/close`);
export const fetchRepayments = (id)    => axios.get(`${BASE}/loans/${id}/repayments`);
export const createRepayment = (id, d) => axios.post(`${BASE}/loans/${id}/repayments`, d);

// ── Advances ──────────────────────────────────────────────────────────────────
export const fetchAdvances    = (p)     => axios.get(`${BASE}/advances`, { params: p });
export const createAdvance    = (d)     => axios.post(`${BASE}/advances`, d);
export const fetchAdvance     = (id)    => axios.get(`${BASE}/advances/${id}`);
export const approveAdvance   = (id, d) => axios.patch(`${BASE}/advances/${id}/approve`, d);
export const recoverAdvance   = (id, d) => axios.patch(`${BASE}/advances/${id}/recover`, d);

// ── Reports ───────────────────────────────────────────────────────────────────
export const fetchPayrollSummary   = (p) => axios.get(`${BASE}/reports/summary`,        { params: p });
export const fetchSalaryRegister   = (p) => axios.get(`${BASE}/reports/register`,       { params: p });
export const fetchBankTransferSheet= (p) => axios.get(`${BASE}/reports/bank-transfer`,  { params: p });
export const fetchPayrollVariance  = (p) => axios.get(`${BASE}/reports/variance`,       { params: p });
export const fetchDepartmentCost   = (p) => axios.get(`${BASE}/reports/department-cost`,{ params: p });
export const fetchCostCenterPayroll= (p) => axios.get(`${BASE}/reports/cost-center`,    { params: p });
export const fetchMonthlyPayroll   = (p) => axios.get(`${BASE}/reports/monthly`,        { params: p });
export const fetchAnnualPayroll    = (p) => axios.get(`${BASE}/reports/annual`,         { params: p });

// ── Settings ──────────────────────────────────────────────────────────────────
export const fetchPayrollSettings  = ()  => axios.get(`${BASE}/settings`);
export const updatePayrollSettings = (d) => axios.put(`${BASE}/settings`, d);
