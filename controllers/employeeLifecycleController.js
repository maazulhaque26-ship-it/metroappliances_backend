'use strict';
const Employee          = require('../models/Employee');
const EmployeeTransfer  = require('../models/EmployeeTransfer');
const EmployeePromotion = require('../models/EmployeePromotion');
const EmployeeProbation = require('../models/EmployeeProbation');
const EmployeeExit      = require('../models/EmployeeExit');
const AuditLog          = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, fail, serverError } = require('../utils/response');

const auditIt = async (req, action, entity, id, label, before, after) => {
  await AuditLog.create({
    admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role,
    action, entity, entityId: id, entityLabel: label,
    changes: { before, after },
    ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
    userAgent: (req.get('User-Agent') || '').slice(0, 300),
  });
};

// ── Transfers ─────────────────────────────────────────────────────────────────
exports.getTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, employee } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status = status;
    if (employee) filter.employee = employee;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EmployeeTransfer.find(filter)
        .populate('employee', 'displayName employeeCode')
        .populate('fromDepartment toDepartment', 'name deptCode')
        .populate('fromLocation toLocation', 'name locationCode')
        .populate('fromDesignation toDesignation', 'title designationCode')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      EmployeeTransfer.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getTransfer = async (req, res) => {
  try {
    const doc = await EmployeeTransfer.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'displayName employeeCode')
      .populate('fromDepartment toDepartment', 'name')
      .populate('fromLocation toLocation', 'name')
      .populate('fromDesignation toDesignation', 'title');
    if (!doc) return notFound(res, 'Transfer');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createTransfer = async (req, res) => {
  try {
    const doc = await EmployeeTransfer.create({ ...req.body, initiatedBy: req.user._id });
    const io = req.app.locals.io;
    if (io) io.emit('hr:transfer_created', { transferNumber: doc.transferNumber, employeeId: doc.employee });
    await auditIt(req, 'TRANSFER_CREATED', 'EmployeeTransfer', doc._id, doc.transferNumber, null, doc.toObject());
    return created(res, doc, 'Transfer created');
  } catch (err) { return serverError(res, err); }
};

exports.approveTransfer = async (req, res) => {
  try {
    const before = await EmployeeTransfer.findById(req.params.id).lean();
    const doc = await EmployeeTransfer.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true },
    );
    if (!doc) return notFound(res, 'Transfer');
    // Apply the transfer to the employee record
    const updates = {};
    if (doc.toDepartment)      updates.department       = doc.toDepartment;
    if (doc.toDesignation)     updates.designation      = doc.toDesignation;
    if (doc.toLocation)        updates.location         = doc.toLocation;
    if (doc.toBusinessUnit)    updates.businessUnit     = doc.toBusinessUnit;
    if (doc.toReportingManager) updates.reportingManager = doc.toReportingManager;
    await Employee.findByIdAndUpdate(doc.employee, updates);
    await doc.updateOne({ status: 'completed' });
    await auditIt(req, 'TRANSFER_APPROVED', 'EmployeeTransfer', doc._id, doc.transferNumber, before, doc.toObject());
    return ok(res, doc, 'Transfer approved and applied');
  } catch (err) { return serverError(res, err); }
};

exports.rejectTransfer = async (req, res) => {
  try {
    const doc = await EmployeeTransfer.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true },
    );
    if (!doc) return notFound(res, 'Transfer');
    return ok(res, doc, 'Transfer rejected');
  } catch (err) { return serverError(res, err); }
};

exports.deleteTransfer = async (req, res) => {
  try {
    await EmployeeTransfer.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return noContent(res, 'Transfer deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Promotions ────────────────────────────────────────────────────────────────
exports.getPromotions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, employee } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status = status;
    if (employee) filter.employee = employee;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EmployeePromotion.find(filter)
        .populate('employee', 'displayName employeeCode')
        .populate('fromDesignation toDesignation', 'title designationCode')
        .populate('fromDepartment toDepartment', 'name deptCode')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      EmployeePromotion.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createPromotion = async (req, res) => {
  try {
    const doc = await EmployeePromotion.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('hr:promotion_created', { promotionNumber: doc.promotionNumber, employeeId: doc.employee });
    await auditIt(req, 'PROMOTION_CREATED', 'EmployeePromotion', doc._id, doc.promotionNumber, null, doc.toObject());
    return created(res, doc, 'Promotion created');
  } catch (err) { return serverError(res, err); }
};

exports.approvePromotion = async (req, res) => {
  try {
    const before = await EmployeePromotion.findById(req.params.id).lean();
    const doc = await EmployeePromotion.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true },
    );
    if (!doc) return notFound(res, 'Promotion');
    const updates = {};
    if (doc.toDesignation) updates.designation = doc.toDesignation;
    if (doc.toDepartment)  updates.department  = doc.toDepartment;
    if (doc.toCtc)         updates.ctc         = doc.toCtc;
    if (doc.toBasic)       updates.basicSalary = doc.toBasic;
    await Employee.findByIdAndUpdate(doc.employee, updates);
    await auditIt(req, 'PROMOTION_APPROVED', 'EmployeePromotion', doc._id, doc.promotionNumber, before, doc.toObject());
    return ok(res, doc, 'Promotion approved');
  } catch (err) { return serverError(res, err); }
};

exports.rejectPromotion = async (req, res) => {
  try {
    const doc = await EmployeePromotion.findByIdAndUpdate(req.params.id, { status: 'rejected', approvedBy: req.user._id, approvedAt: new Date() }, { new: true });
    if (!doc) return notFound(res, 'Promotion');
    return ok(res, doc, 'Promotion rejected');
  } catch (err) { return serverError(res, err); }
};

exports.deletePromotion = async (req, res) => {
  try {
    await EmployeePromotion.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return noContent(res, 'Promotion deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Probation ─────────────────────────────────────────────────────────────────
exports.getProbations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EmployeeProbation.find(filter)
        .populate('employee', 'displayName employeeCode joiningDate')
        .populate('confirmedBy', 'name')
        .sort({ endDate: 1 })
        .skip(skip).limit(Number(limit)),
      EmployeeProbation.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createProbation = async (req, res) => {
  try {
    const doc = await EmployeeProbation.create(req.body);
    return created(res, doc, 'Probation record created');
  } catch (err) { return serverError(res, err); }
};

exports.confirmProbation = async (req, res) => {
  try {
    const doc = await EmployeeProbation.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', confirmedBy: req.user._id, confirmedAt: new Date() },
      { new: true },
    );
    if (!doc) return notFound(res, 'Probation');
    await Employee.findByIdAndUpdate(doc.employee, { status: 'active', confirmationDate: new Date() });
    const io = req.app.locals.io;
    if (io) io.emit('hr:employee_confirmed', { employeeId: doc.employee });
    return ok(res, doc, 'Probation confirmed — employee confirmed');
  } catch (err) { return serverError(res, err); }
};

exports.extendProbation = async (req, res) => {
  try {
    const { extensionMonths, extensionReason } = req.body;
    const doc = await EmployeeProbation.findById(req.params.id);
    if (!doc) return notFound(res, 'Probation');
    const newEnd = new Date(doc.endDate);
    newEnd.setMonth(newEnd.getMonth() + Number(extensionMonths || 1));
    await doc.updateOne({ status: 'extended', extensionMonths, extensionReason, endDate: newEnd });
    return ok(res, { ...doc.toObject(), endDate: newEnd }, 'Probation extended');
  } catch (err) { return serverError(res, err); }
};

exports.deleteProbation = async (req, res) => {
  try {
    await EmployeeProbation.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return noContent(res, 'Probation deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Exits ─────────────────────────────────────────────────────────────────────
exports.getExits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, exitType } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status = status;
    if (exitType) filter.exitType = exitType;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EmployeeExit.find(filter)
        .populate('employee', 'displayName employeeCode department')
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      EmployeeExit.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getExit = async (req, res) => {
  try {
    const doc = await EmployeeExit.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'displayName employeeCode');
    if (!doc) return notFound(res, 'Exit');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createExit = async (req, res) => {
  try {
    const doc = await EmployeeExit.create(req.body);
    await Employee.findByIdAndUpdate(doc.employee, { status: 'on_notice', exitDate: doc.lastWorkingDay });
    const io = req.app.locals.io;
    if (io) io.emit('hr:employee_exited', { exitNumber: doc.exitNumber, employeeId: doc.employee });
    await auditIt(req, 'EXIT_INITIATED', 'EmployeeExit', doc._id, doc.exitNumber, null, doc.toObject());
    return created(res, doc, 'Exit initiated');
  } catch (err) { return serverError(res, err); }
};

exports.updateExit = async (req, res) => {
  try {
    const doc = await EmployeeExit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return notFound(res, 'Exit');
    if (doc.status === 'completed') {
      await Employee.findByIdAndUpdate(doc.employee, { status: 'terminated', exitDate: doc.lastWorkingDay });
    }
    return ok(res, doc, 'Exit updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteExit = async (req, res) => {
  try {
    await EmployeeExit.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return noContent(res, 'Exit deleted');
  } catch (err) { return serverError(res, err); }
};
