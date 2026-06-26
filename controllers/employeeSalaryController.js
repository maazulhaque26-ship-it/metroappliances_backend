'use strict';
const EmployeeSalary = require('../models/EmployeeSalary');
const Payslip        = require('../models/Payslip');
const AuditLog       = require('../models/AuditLog');
const { ok, created, paginated, notFound, serverError } = require('../utils/response');

// ── Employee Salary Assignments ───────────────────────────────────────────────

exports.getEmployeeSalaries = async (req, res) => {
  try {
    const { employee, isActive, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EmployeeSalary.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName')
        .populate('structure', 'name structureCode')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      EmployeeSalary.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.assignSalary = async (req, res) => {
  try {
    // Deactivate existing active record for this employee
    await EmployeeSalary.updateMany(
      { employee: req.body.employee, isActive: true, isDeleted: false },
      { isActive: false, effectiveTo: new Date() }
    );
    const doc = await EmployeeSalary.create(req.body);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'EmployeeSalary', entityId: doc._id, entityLabel: `Employee salary assignment`, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Employee salary assigned');
  } catch (e) { return serverError(res, e); }
};

exports.getEmployeeSalary = async (req, res) => {
  try {
    const doc = await EmployeeSalary.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName department')
      .populate('structure', 'name structureCode components');
    if (!doc) return notFound(res, 'Employee salary');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateEmployeeSalary = async (req, res) => {
  try {
    const doc = await EmployeeSalary.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Employee salary');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'UPDATE', entity: 'EmployeeSalary', entityId: doc._id, entityLabel: 'Employee salary', changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, doc, 'Employee salary updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteEmployeeSalary = async (req, res) => {
  try {
    const doc = await EmployeeSalary.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Employee salary');
    doc.isDeleted = true;
    await doc.save();
    return ok(res, null, 'Employee salary deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Payslips ──────────────────────────────────────────────────────────────────

exports.getPayslips = async (req, res) => {
  try {
    const { employee, payrollRun, period, isPublished, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (employee)   filter.employee   = employee;
    if (payrollRun) filter.payrollRun = payrollRun;
    if (period)     filter.period     = period;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Payslip.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName')
        .populate('period', 'name startDate endDate')
        .populate('payrollRun', 'runNumber status')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Payslip.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.getPayslip = async (req, res) => {
  try {
    const doc = await Payslip.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName department designation')
      .populate('period', 'name startDate endDate payDate')
      .populate('payrollRun', 'runNumber status')
      .populate({ path: 'payrollEmployee', select: 'basicSalary grossEarnings totalDeductions netPay hra travelAllowance medicalAllowance specialAllowance employeePF employeeESI tds professionalTax paidDays workingDays lopDays' });
    if (!doc) return notFound(res, 'Payslip');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.publishPayslip = async (req, res) => {
  try {
    const doc = await Payslip.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Payslip');
    doc.isPublished = true;
    doc.publishedAt = new Date();
    await doc.save();
    return ok(res, doc, 'Payslip published');
  } catch (e) { return serverError(res, e); }
};
