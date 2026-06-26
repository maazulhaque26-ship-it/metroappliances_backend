'use strict';
const Loan          = require('../models/Loan');
const LoanRepayment = require('../models/LoanRepayment');
const AdvanceSalary = require('../models/AdvanceSalary');
const AuditLog      = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── Loans ─────────────────────────────────────────────────────────────────────

exports.getLoans = async (req, res) => {
  try {
    const { employee, status, loanType, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;
    if (loanType) filter.loanType = loanType;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Loan.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Loan.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createLoan = async (req, res) => {
  try {
    const doc = await Loan.create(req.body);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'Loan', entityId: doc._id, entityLabel: doc.loanNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Loan created');
  } catch (e) { return serverError(res, e); }
};

exports.getLoan = async (req, res) => {
  try {
    const doc = await Loan.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName')
      .populate('approvedBy', 'name');
    if (!doc) return notFound(res, 'Loan');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateLoan = async (req, res) => {
  try {
    const doc = await Loan.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Loan');
    if (!['applied','approved'].includes(doc.status)) return fail(res, 'Cannot edit loan in current status');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'UPDATE', entity: 'Loan', entityId: doc._id, entityLabel: doc.loanNumber, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, doc, 'Loan updated');
  } catch (e) { return serverError(res, e); }
};

exports.approveLoan = async (req, res) => {
  try {
    const doc = await Loan.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Loan');
    if (doc.status !== 'applied') return fail(res, 'Loan is not in applied status');
    doc.status      = 'approved';
    doc.approvedBy  = req.admin._id;
    doc.approvedAt  = new Date();
    doc.disbursedAmount    = doc.principal;
    doc.outstandingBalance = doc.principal;
    doc.disbursementDate   = req.body.disbursementDate || new Date();
    if (req.body.firstEmiDate) doc.firstEmiDate = req.body.firstEmiDate;
    // Compute EMI (simple flat rate)
    const monthlyInterest = (doc.principal * doc.interestRate) / (12 * 100);
    doc.emi = Math.ceil((doc.principal / doc.tenure) + monthlyInterest);
    await doc.save();
    // Generate repayment schedule
    const repayments = [];
    const emiDate = doc.firstEmiDate || new Date();
    for (let i = 1; i <= doc.tenure; i++) {
      const due = new Date(emiDate);
      due.setMonth(due.getMonth() + (i - 1));
      repayments.push({
        loan: doc._id, employee: doc.employee,
        installmentNumber: i, dueDate: due,
        principal: Math.ceil(doc.principal / doc.tenure),
        interest:  Math.ceil(monthlyInterest),
        totalAmount: doc.emi,
      });
    }
    if (repayments.length) await LoanRepayment.insertMany(repayments);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'APPROVE', entity: 'Loan', entityId: doc._id, entityLabel: doc.loanNumber, changes: { before: { status: 'applied' }, after: { status: 'approved' } }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, doc, 'Loan approved and repayment schedule generated');
  } catch (e) { return serverError(res, e); }
};

exports.closeLoan = async (req, res) => {
  try {
    const doc = await Loan.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Loan');
    doc.status = 'closed';
    doc.outstandingBalance = 0;
    await doc.save();
    return ok(res, doc, 'Loan closed');
  } catch (e) { return serverError(res, e); }
};

exports.getRepayments = async (req, res) => {
  try {
    const data = await LoanRepayment.find({ loan: req.params.id, isDeleted: false }).sort({ installmentNumber: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createRepayment = async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, isDeleted: false });
    if (!loan) return notFound(res, 'Loan');
    const doc = await LoanRepayment.create({ ...req.body, loan: req.params.id, employee: loan.employee });
    return created(res, doc, 'Repayment recorded');
  } catch (e) { return serverError(res, e); }
};

// ── Advances ──────────────────────────────────────────────────────────────────

exports.getAdvances = async (req, res) => {
  try {
    const { employee, status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AdvanceSalary.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      AdvanceSalary.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createAdvance = async (req, res) => {
  try {
    const doc = await AdvanceSalary.create(req.body);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'AdvanceSalary', entityId: doc._id, entityLabel: doc.advanceNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Salary advance created');
  } catch (e) { return serverError(res, e); }
};

exports.getAdvance = async (req, res) => {
  try {
    const doc = await AdvanceSalary.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName')
      .populate('approvedBy', 'name')
      .populate('recoveryStartPeriod', 'name startDate endDate');
    if (!doc) return notFound(res, 'Salary advance');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.approveAdvance = async (req, res) => {
  try {
    const doc = await AdvanceSalary.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Salary advance');
    if (doc.status !== 'applied') return fail(res, 'Advance is not in applied status');
    doc.status              = 'approved';
    doc.approvedBy          = req.admin._id;
    doc.approvedAt          = new Date();
    doc.balance             = doc.amount;
    doc.recoveryPerInstallment = Math.ceil(doc.amount / (doc.recoveryInstallments || 1));
    if (req.body.recoveryStartPeriod) doc.recoveryStartPeriod = req.body.recoveryStartPeriod;
    if (req.body.disbursementDate)    doc.disbursementDate = req.body.disbursementDate;
    await doc.save();
    return ok(res, doc, 'Salary advance approved');
  } catch (e) { return serverError(res, e); }
};

exports.recoverAdvance = async (req, res) => {
  try {
    const doc = await AdvanceSalary.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Salary advance');
    const amount = Number(req.body.amount) || doc.recoveryPerInstallment;
    doc.amountRecovered += amount;
    doc.balance = Math.max(0, doc.amount - doc.amountRecovered);
    doc.status = doc.balance <= 0 ? 'recovered' : 'recovering';
    await doc.save();
    return ok(res, doc, 'Advance recovery recorded');
  } catch (e) { return serverError(res, e); }
};
