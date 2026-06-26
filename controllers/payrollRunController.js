'use strict';
const mongoose         = require('mongoose');
const PayrollPeriod    = require('../models/PayrollPeriod');
const PayrollRun       = require('../models/PayrollRun');
const PayrollEmployee  = require('../models/PayrollEmployee');
const PayrollAdjustment = require('../models/PayrollAdjustment');
const PayrollSetting   = require('../models/PayrollSetting');
const PayrollTax       = require('../models/PayrollTax');
const PayrollTransaction = require('../models/PayrollTransaction');
const Payslip          = require('../models/Payslip');
const EmployeeSalary   = require('../models/EmployeeSalary');
const Bonus            = require('../models/Bonus');
const Incentive        = require('../models/Incentive');
const Overtime         = require('../models/Overtime');
const Loan             = require('../models/Loan');
const LoanRepayment    = require('../models/LoanRepayment');
const AdvanceSalary    = require('../models/AdvanceSalary');
const AuditLog         = require('../models/AuditLog');
const { postPayrollToGL } = require('../utils/payrollGL');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── Payroll Periods ────────────────────────────────────────────────────────────

exports.getPeriods = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      PayrollPeriod.find(filter).sort({ startDate: -1 }).skip(skip).limit(Number(limit)),
      PayrollPeriod.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createPeriod = async (req, res) => {
  try {
    const doc = await PayrollPeriod.create(req.body);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'PayrollPeriod', entityId: doc._id, entityLabel: doc.name, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Payroll period created');
  } catch (e) { return serverError(res, e); }
};

exports.getPeriod = async (req, res) => {
  try {
    const doc = await PayrollPeriod.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payroll period');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updatePeriod = async (req, res) => {
  try {
    const doc = await PayrollPeriod.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payroll period');
    if (doc.status === 'closed') return fail(res, 'Cannot edit a closed period');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Payroll period updated');
  } catch (e) { return serverError(res, e); }
};

exports.deletePeriod = async (req, res) => {
  try {
    const doc = await PayrollPeriod.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payroll period');
    if (doc.status !== 'open') return fail(res, 'Only open periods can be deleted');
    doc.isDeleted = true;
    await doc.save();
    return ok(res, null, 'Payroll period deleted');
  } catch (e) { return serverError(res, e); }
};

exports.closePeriod = async (req, res) => {
  try {
    const doc = await PayrollPeriod.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payroll period');
    if (doc.status === 'closed') return fail(res, 'Period already closed');
    doc.status = 'closed';
    await doc.save();
    return ok(res, doc, 'Payroll period closed');
  } catch (e) { return serverError(res, e); }
};

// ── Payroll Runs ──────────────────────────────────────────────────────────────

exports.getRuns = async (req, res) => {
  try {
    const { status, period, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (period) filter.period = period;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      PayrollRun.find(filter)
        .populate('period', 'name startDate endDate payDate')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      PayrollRun.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createRun = async (req, res) => {
  try {
    const period = await PayrollPeriod.findOne({ _id: req.body.period, isDeleted: false });
    if (!period) return notFound(res, 'Payroll period');
    if (period.status === 'closed') return fail(res, 'Cannot create run for a closed period');
    const existing = await PayrollRun.findOne({ period: req.body.period, runType: req.body.runType || 'regular', isDeleted: false });
    if (existing && existing.status !== 'draft') return fail(res, 'A run already exists for this period');
    const doc = await PayrollRun.create({ ...req.body, status: 'draft' });
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'PayrollRun', entityId: doc._id, entityLabel: doc.runNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Payroll run created');
  } catch (e) { return serverError(res, e); }
};

exports.getRun = async (req, res) => {
  try {
    const doc = await PayrollRun.findOne({ _id: req.params.id, isDeleted: false })
      .populate('period', 'name startDate endDate payDate workingDays')
      .populate('calculatedBy approvedBy postedBy paidBy', 'name');
    if (!doc) return notFound(res, 'Payroll run');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Payroll Calculation Engine ────────────────────────────────────────────────

exports.calculateRun = async (req, res) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, isDeleted: false }).populate('period');
    if (!run) return notFound(res, 'Payroll run');
    if (!['draft', 'calculated'].includes(run.status)) return fail(res, `Cannot calculate a run in '${run.status}' status`);
    const period  = run.period;
    const settings = await PayrollSetting.findOne({ isDeleted: false });
    const workingDays = period.workingDays || (settings?.workingDaysPerMonth || 26);
    const pfRate        = settings?.pfRate       || 12;
    const employerPFRate= settings?.employerPFRate|| 12;
    const pfWageCeiling = settings?.pfWageCeiling || 15000;
    const esiRate       = settings?.esiRate       || 0.75;
    const employerESIRate=settings?.employerESIRate|| 3.25;
    const esiWageCeiling= settings?.esiWageCeiling || 21000;

    // Fetch all active employee salary assignments
    const empSalaries = await EmployeeSalary.find({ isActive: true, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode department pfApplicable esiApplicable');

    if (empSalaries.length === 0) return fail(res, 'No employees with active salary assignments found');

    // Clear any existing draft PayrollEmployee records for this run
    await PayrollEmployee.deleteMany({ payrollRun: run._id });

    const Attendance   = mongoose.model('Attendance');
    const payEmpDocs   = [];
    let totGross = 0, totDeductions = 0, totNetPay = 0, totEmployerPF = 0, totEmployerESI = 0;

    for (const es of empSalaries) {
      const empId = es.employee._id || es.employee;

      // Attendance: count by status within the period
      const attRecords = await Attendance.find({
        employee: empId,
        date: { $gte: period.startDate, $lte: period.endDate },
        isDeleted: false,
      }).select('status');

      const presentCount = attRecords.filter(a => ['present', 'work_from_home'].includes(a.status)).length;
      const halfDayCount = attRecords.filter(a => a.status === 'half_day').length;
      const onLeaveCount = attRecords.filter(a => a.status === 'on_leave').length;
      const presentDays  = presentCount + (halfDayCount * 0.5) + onLeaveCount;
      const lopDays      = Math.max(0, workingDays - presentDays);
      const paidDays     = workingDays - lopDays;

      const ratio = workingDays > 0 ? paidDays / workingDays : 1;

      // Pro-rate earnings
      const basic  = Math.round((es.basicSalary           || 0) * ratio);
      const hra    = Math.round((es.hra                   || 0) * ratio);
      const ta     = Math.round((es.travelAllowance       || 0) * ratio);
      const med    = Math.round((es.medicalAllowance      || 0) * ratio);
      const special= Math.round((es.specialAllowance      || 0) * ratio);

      // Approved bonuses for this period
      const bonuses = await Bonus.find({ employee: empId, period: period._id, status: 'approved', isDeleted: false });
      const bonusAmt = bonuses.reduce((s, b) => s + b.amount, 0);

      // Approved incentives for this period
      const incentives = await Incentive.find({ employee: empId, period: period._id, status: 'approved', isDeleted: false });
      const incAmt = incentives.reduce((s, i) => s + i.amount, 0);

      // Approved overtime for this period
      const ovtRecs = await Overtime.find({ employee: empId, period: period._id, status: 'approved', isDeleted: false });
      const ovtAmt  = ovtRecs.reduce((s, o) => s + o.amount, 0);

      const grossEarnings = basic + hra + ta + med + special + bonusAmt + incAmt + ovtAmt;

      // PF calculation
      let empPF = 0, emplrPF = 0;
      if (es.pfApplicable !== false) {
        const pfWage = Math.min(pfWageCeiling, basic);
        empPF   = Math.round(pfWage * pfRate      / 100);
        emplrPF = Math.round(pfWage * employerPFRate / 100);
      }

      // ESI calculation (if gross <= esiWageCeiling)
      let empESI = 0, emplrESI = 0;
      if (es.esiApplicable !== false && grossEarnings <= esiWageCeiling) {
        empESI   = Math.round(grossEarnings * esiRate        / 100);
        emplrESI = Math.round(grossEarnings * employerESIRate / 100);
      }

      // Professional Tax (Karnataka slab)
      let pt = 0;
      if (grossEarnings > 15000) pt = 200;

      // TDS (simplified: 0 for now, full annual calculation needed in real impl)
      const tds = 0;

      // Loan deductions
      const loanReps = await LoanRepayment.find({
        employee: empId, status: 'pending', isDeleted: false,
        dueDate: { $gte: period.startDate, $lte: period.endDate },
      });
      const loanDed  = loanReps.reduce((s, r) => s + r.totalAmount, 0);

      // Advance deductions
      const activeAdvances = await AdvanceSalary.find({
        employee: empId, status: { $in: ['approved','disbursed','recovering'] }, isDeleted: false,
      });
      const advanceDed = activeAdvances.reduce((s, a) => s + (a.recoveryPerInstallment || 0), 0);

      const totalDeductions = empPF + empESI + tds + pt + loanDed + advanceDed;
      const netPay          = Math.max(0, grossEarnings - totalDeductions);

      payEmpDocs.push({
        payrollRun: run._id, employee: empId, period: period._id, employeeSalary: es._id,
        workingDays, presentDays, paidDays, lopDays,
        basicSalary: basic, hra, travelAllowance: ta, medicalAllowance: med,
        specialAllowance: special, overtimePay: ovtAmt, bonusAmount: bonusAmt, incentiveAmount: incAmt,
        grossEarnings,
        employeePF: empPF, employeeESI: empESI, tds, professionalTax: pt,
        loanDeduction: loanDed, advanceDeduction: advanceDed,
        totalDeductions,
        employerPF: emplrPF, employerESI: emplrESI,
        netPay,
        paymentMode: es.paymentMode || 'bank_transfer',
        status: 'calculated',
      });

      totGross       += grossEarnings;
      totDeductions  += totalDeductions;
      totNetPay      += netPay;
      totEmployerPF  += emplrPF;
      totEmployerESI += emplrESI;
    }

    if (payEmpDocs.length) await PayrollEmployee.insertMany(payEmpDocs);

    run.status          = 'calculated';
    run.totalEmployees  = payEmpDocs.length;
    run.totalGross      = totGross;
    run.totalDeductions = totDeductions;
    run.totalNetPay     = totNetPay;
    run.totalEmployerPF = totEmployerPF;
    run.totalEmployerESI= totEmployerESI;
    run.calculatedAt    = new Date();
    run.calculatedBy    = req.admin._id;
    await run.save();

    const io = req.app.locals.io;
    if (io) io.emit('hr:payroll_calculated', { runId: run._id, runNumber: run.runNumber, totalEmployees: run.totalEmployees, totalNetPay: run.totalNetPay });

    return ok(res, run, `Payroll calculated for ${payEmpDocs.length} employees`);
  } catch (e) { return serverError(res, e); }
};

exports.approveRun = async (req, res) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!run) return notFound(res, 'Payroll run');
    if (run.status !== 'calculated') return fail(res, 'Only calculated runs can be approved');
    run.status     = 'approved';
    run.approvedAt = new Date();
    run.approvedBy = req.admin._id;
    if (req.body.remarks) run.remarks = req.body.remarks;
    await run.save();
    await PayrollEmployee.updateMany({ payrollRun: run._id, isDeleted: false }, { status: 'approved' });
    const io = req.app.locals.io;
    if (io) io.emit('hr:payroll_approved', { runId: run._id, runNumber: run.runNumber });
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'APPROVE', entity: 'PayrollRun', entityId: run._id, entityLabel: run.runNumber, changes: { before: { status: 'calculated' }, after: { status: 'approved' } }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, run, 'Payroll run approved');
  } catch (e) { return serverError(res, e); }
};

exports.postRun = async (req, res) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, isDeleted: false }).populate('period', 'name startDate endDate');
    if (!run) return notFound(res, 'Payroll run');
    if (run.status !== 'approved') return fail(res, 'Only approved runs can be posted');
    const employees = await PayrollEmployee.find({ payrollRun: run._id, isDeleted: false });
    const settings  = await PayrollSetting.findOne({ isDeleted: false });

    // Post to GL (skip gracefully if accounts not configured)
    const journal = await postPayrollToGL(run, employees, settings || {}, req.admin._id);

    run.status   = 'posted';
    run.postedAt = new Date();
    run.postedBy = req.admin._id;
    if (journal) run.journalEntry = journal._id;
    await run.save();

    const io = req.app.locals.io;
    if (io) {
      io.emit('hr:payroll_posted',       { runId: run._id, runNumber: run.runNumber });
      if (journal) io.emit('finance:payroll_posted', { runId: run._id, journalId: journal._id, journalNumber: journal.journalNumber });
    }
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'POST', entity: 'PayrollRun', entityId: run._id, entityLabel: run.runNumber, changes: { before: { status: 'approved' }, after: { status: 'posted' } }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, run, 'Payroll run posted to accounts');
  } catch (e) { return serverError(res, e); }
};

exports.payRun = async (req, res) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!run) return notFound(res, 'Payroll run');
    if (run.status !== 'posted') return fail(res, 'Only posted runs can be marked as paid');

    const employees = await PayrollEmployee.find({ payrollRun: run._id, isDeleted: false });
    const now = new Date();

    // Create PayrollTransaction per employee
    const txns = employees.map(e => ({
      payrollRun:      run._id,
      employee:        e.employee,
      payrollEmployee: e._id,
      amount:          e.netPay,
      paymentMode:     e.paymentMode,
      transactionDate: now,
      status:          'completed',
    }));
    if (txns.length) await PayrollTransaction.insertMany(txns);

    // Update PayrollEmployee payment status
    await PayrollEmployee.updateMany({ payrollRun: run._id, isDeleted: false }, { status: 'paid', paymentStatus: 'paid', paidAt: now });

    // Generate Payslips
    const payslips = employees.map(e => ({
      payrollRun:      run._id,
      employee:        e.employee,
      payrollEmployee: e._id,
      period:          run.period,
      generatedAt:     now,
      isPublished:     false,
    }));
    if (payslips.length) await Payslip.insertMany(payslips);

    run.status = 'paid';
    run.paidAt = now;
    run.paidBy = req.admin._id;
    await run.save();

    // Mark loan repayments as paid for this period
    setImmediate(async () => {
      try {
        for (const e of employees) {
          if (e.loanDeduction > 0) {
            await LoanRepayment.updateMany(
              { employee: e.employee, status: 'pending', payrollRun: { $exists: false } },
              { status: 'paid', paidAt: now, payrollRun: run._id }
            );
          }
          if (e.advanceDeduction > 0) {
            const advance = await AdvanceSalary.findOne({ employee: e.employee, status: { $in: ['approved','disbursed','recovering'] }, isDeleted: false });
            if (advance) {
              advance.amountRecovered += e.advanceDeduction;
              advance.balance = Math.max(0, advance.amount - advance.amountRecovered);
              advance.status  = advance.balance <= 0 ? 'recovered' : 'recovering';
              await advance.save();
            }
          }
        }
      } catch (_) {}
    });

    const io = req.app.locals.io;
    if (io) io.emit('hr:payroll_paid', { runId: run._id, runNumber: run.runNumber, totalNetPay: run.totalNetPay });
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'PAY', entity: 'PayrollRun', entityId: run._id, entityLabel: run.runNumber, changes: { before: { status: 'posted' }, after: { status: 'paid' } }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, run, `Payroll paid — ${employees.length} transactions created, payslips generated`);
  } catch (e) { return serverError(res, e); }
};

exports.getRunEmployees = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { payrollRun: req.params.id, isDeleted: false };
    if (status) filter.status = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      PayrollEmployee.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName department designation')
        .sort({ 'employee.employeeCode': 1 })
        .skip(skip).limit(Number(limit)),
      PayrollEmployee.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.getPayrollEmployee = async (req, res) => {
  try {
    const doc = await PayrollEmployee.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName department designation')
      .populate('period', 'name startDate endDate')
      .populate('payrollRun', 'runNumber status');
    if (!doc) return notFound(res, 'Payroll employee');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.addAdjustment = async (req, res) => {
  try {
    const emp = await PayrollEmployee.findOne({ _id: req.params.id, isDeleted: false });
    if (!emp) return notFound(res, 'Payroll employee entry');
    const doc = await PayrollAdjustment.create({
      ...req.body,
      payrollRun: emp.payrollRun,
      employee:   emp.employee,
    });
    return created(res, doc, 'Adjustment added');
  } catch (e) { return serverError(res, e); }
};
