'use strict';
const PayrollRun     = require('../models/PayrollRun');
const PayrollEmployee= require('../models/PayrollEmployee');
const PayrollPeriod  = require('../models/PayrollPeriod');
const Loan           = require('../models/Loan');
const Bonus          = require('../models/Bonus');
const { ok, fail, serverError } = require('../utils/response');

// ── 1. Payroll Summary ────────────────────────────────────────────────────────
exports.getPayrollSummary = async (req, res) => {
  try {
    const { periodId, runId } = req.query;
    const filter = { isDeleted: false };
    if (runId)    filter._id    = runId;
    if (periodId) filter.period = periodId;
    const run = await PayrollRun.findOne(filter).populate('period', 'name startDate endDate');
    if (!run) return fail(res, 'No payroll run found');
    const employees = await PayrollEmployee.find({ payrollRun: run._id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode department designation');
    return ok(res, { run, employees, total: employees.length });
  } catch (e) { return serverError(res, e); }
};

// ── 2. Salary Register ────────────────────────────────────────────────────────
exports.getSalaryRegister = async (req, res) => {
  try {
    const { runId, periodId } = req.query;
    if (!runId && !periodId) return fail(res, 'runId or periodId is required');
    const filter = { isDeleted: false };
    if (runId)    filter._id    = runId;
    if (periodId) filter.period = periodId;
    const run = await PayrollRun.findOne(filter).populate('period', 'name startDate endDate payDate');
    if (!run) return fail(res, 'No payroll run found');
    const rows = await PayrollEmployee.find({ payrollRun: run._id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode panNumber uanNumber pfAccountNumber bankName bankAccountNumber displayName')
      .sort({ 'employee.employeeCode': 1 });
    return ok(res, { period: run.period, runNumber: run.runNumber, rows, summary: { totalGross: run.totalGross, totalDeductions: run.totalDeductions, totalNetPay: run.totalNetPay, totalEmployees: run.totalEmployees } });
  } catch (e) { return serverError(res, e); }
};

// ── 3. Bank Transfer Sheet ────────────────────────────────────────────────────
exports.getBankTransferSheet = async (req, res) => {
  try {
    const { runId } = req.query;
    if (!runId) return fail(res, 'runId is required');
    const run = await PayrollRun.findOne({ _id: runId, isDeleted: false }).populate('period', 'name payDate');
    if (!run) return fail(res, 'Payroll run not found');
    const employees = await PayrollEmployee.find({ payrollRun: run._id, paymentMode: 'bank_transfer', isDeleted: false })
      .populate('employeeSalary', 'bankAccountNumber bankName ifscCode');
    const rows = employees.map(e => ({
      employeeId:    e.employee,
      netPay:        e.netPay,
      bankAccount:   e.employeeSalary?.bankAccountNumber || '',
      bankName:      e.employeeSalary?.bankName          || '',
      ifscCode:      e.employeeSalary?.ifscCode          || '',
    }));
    return ok(res, { runNumber: run.runNumber, payDate: run.period?.payDate, rows, totalTransfer: rows.reduce((s, r) => s + r.netPay, 0) });
  } catch (e) { return serverError(res, e); }
};

// ── 4. Payroll Variance ───────────────────────────────────────────────────────
exports.getPayrollVariance = async (req, res) => {
  try {
    const { runId, prevRunId } = req.query;
    if (!runId || !prevRunId) return fail(res, 'runId and prevRunId are required');
    const [currentEmps, prevEmps] = await Promise.all([
      PayrollEmployee.find({ payrollRun: runId,     isDeleted: false }).populate('employee', 'firstName lastName employeeCode'),
      PayrollEmployee.find({ payrollRun: prevRunId, isDeleted: false }).populate('employee', 'firstName lastName employeeCode'),
    ]);
    const prevMap = new Map(prevEmps.map(e => [String(e.employee._id), e]));
    const rows = currentEmps.map(cur => {
      const prev  = prevMap.get(String(cur.employee._id));
      return {
        employee:        cur.employee,
        currentNetPay:   cur.netPay,
        previousNetPay:  prev?.netPay || 0,
        variance:        cur.netPay - (prev?.netPay || 0),
        currentGross:    cur.grossEarnings,
        previousGross:   prev?.grossEarnings || 0,
      };
    });
    return ok(res, rows);
  } catch (e) { return serverError(res, e); }
};

// ── 5. Department Cost ────────────────────────────────────────────────────────
exports.getDepartmentCost = async (req, res) => {
  try {
    const { runId } = req.query;
    if (!runId) return fail(res, 'runId is required');
    const employees = await PayrollEmployee.find({ payrollRun: runId, isDeleted: false })
      .populate('employee', 'department');
    const Department = require('../models/Department');
    const deptIds = [...new Set(employees.map(e => String(e.employee?.department)).filter(Boolean))];
    const depts   = await Department.find({ _id: { $in: deptIds } }, 'name');
    const deptMap = new Map(depts.map(d => [String(d._id), d.name]));
    const byDept  = {};
    for (const e of employees) {
      const deptId = String(e.employee?.department || 'Unassigned');
      if (!byDept[deptId]) byDept[deptId] = { department: deptMap.get(deptId) || 'Unassigned', count: 0, grossEarnings: 0, totalDeductions: 0, netPay: 0 };
      byDept[deptId].count++;
      byDept[deptId].grossEarnings  += e.grossEarnings;
      byDept[deptId].totalDeductions+= e.totalDeductions;
      byDept[deptId].netPay         += e.netPay;
    }
    return ok(res, Object.values(byDept));
  } catch (e) { return serverError(res, e); }
};

// ── 6. Cost Center Payroll ────────────────────────────────────────────────────
exports.getCostCenterPayroll = async (req, res) => {
  try {
    const { runId } = req.query;
    if (!runId) return fail(res, 'runId is required');
    const employees = await PayrollEmployee.find({ payrollRun: runId, isDeleted: false })
      .populate('employee', 'costCenter');
    const byCC = {};
    for (const e of employees) {
      const ccId = String(e.employee?.costCenter || 'No Cost Center');
      if (!byCC[ccId]) byCC[ccId] = { costCenter: ccId, count: 0, totalNetPay: 0, totalGross: 0 };
      byCC[ccId].count++;
      byCC[ccId].totalNetPay += e.netPay;
      byCC[ccId].totalGross  += e.grossEarnings;
    }
    return ok(res, Object.values(byCC));
  } catch (e) { return serverError(res, e); }
};

// ── 7. Monthly Payroll Trend ──────────────────────────────────────────────────
exports.getMonthlyPayroll = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const runs = await PayrollRun.find({
      status: { $in: ['posted','paid'] },
      isDeleted: false,
    }).populate('period', 'name startDate');
    const monthly = [];
    for (let m = 1; m <= 12; m++) {
      const monthRuns = runs.filter(r => {
        const d = r.period?.startDate;
        return d && new Date(d).getFullYear() === Number(year) && new Date(d).getMonth() + 1 === m;
      });
      monthly.push({
        month: m,
        totalGross:    monthRuns.reduce((s, r) => s + r.totalGross,   0),
        totalNetPay:   monthRuns.reduce((s, r) => s + r.totalNetPay,  0),
        totalDeductions:monthRuns.reduce((s, r) => s + r.totalDeductions, 0),
        employees:     monthRuns.reduce((s, r) => s + r.totalEmployees,0),
      });
    }
    return ok(res, monthly);
  } catch (e) { return serverError(res, e); }
};

// ── 8. Annual Payroll Summary ─────────────────────────────────────────────────
exports.getAnnualPayroll = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const runs = await PayrollRun.find({ status: { $in: ['posted','paid'] }, isDeleted: false })
      .populate('period', 'name startDate');
    const yearRuns = runs.filter(r => {
      const d = r.period?.startDate;
      return d && new Date(d).getFullYear() === Number(year);
    });
    const summary = {
      year: Number(year),
      totalRuns:       yearRuns.length,
      totalGross:      yearRuns.reduce((s, r) => s + r.totalGross,      0),
      totalNetPay:     yearRuns.reduce((s, r) => s + r.totalNetPay,     0),
      totalDeductions: yearRuns.reduce((s, r) => s + r.totalDeductions, 0),
      totalEmployerPF: yearRuns.reduce((s, r) => s + r.totalEmployerPF, 0),
      totalEmployerESI:yearRuns.reduce((s, r) => s + r.totalEmployerESI,0),
    };
    return ok(res, { summary, runs: yearRuns });
  } catch (e) { return serverError(res, e); }
};
