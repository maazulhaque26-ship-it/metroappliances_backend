'use strict';
const Bonus     = require('../models/Bonus');
const Incentive = require('../models/Incentive');
const Overtime  = require('../models/Overtime');
const AuditLog  = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── Bonuses ───────────────────────────────────────────────────────────────────

exports.getBonuses = async (req, res) => {
  try {
    const { employee, status, bonusType, period, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (employee)  filter.employee  = employee;
    if (status)    filter.status    = status;
    if (bonusType) filter.bonusType = bonusType;
    if (period)    filter.period    = period;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Bonus.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName')
        .populate('period', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Bonus.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createBonus = async (req, res) => {
  try {
    const doc = await Bonus.create(req.body);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'Bonus', entityId: doc._id, entityLabel: doc.bonusNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Bonus created');
  } catch (e) { return serverError(res, e); }
};

exports.getBonus = async (req, res) => {
  try {
    const doc = await Bonus.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName')
      .populate('period', 'name startDate endDate');
    if (!doc) return notFound(res, 'Bonus');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateBonus = async (req, res) => {
  try {
    const doc = await Bonus.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Bonus');
    if (doc.status === 'paid') return fail(res, 'Cannot edit a paid bonus');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Bonus updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteBonus = async (req, res) => {
  try {
    const doc = await Bonus.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Bonus');
    if (doc.status === 'paid') return fail(res, 'Cannot delete a paid bonus');
    doc.isDeleted = true;
    await doc.save();
    return ok(res, null, 'Bonus deleted');
  } catch (e) { return serverError(res, e); }
};

exports.approveBonus = async (req, res) => {
  try {
    const doc = await Bonus.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Bonus');
    if (doc.status !== 'draft') return fail(res, 'Bonus is not in draft status');
    doc.status     = 'approved';
    doc.approvedBy = req.admin._id;
    doc.approvedAt = new Date();
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('hr:bonus_approved', { bonusId: doc._id, bonusNumber: doc.bonusNumber, employee: doc.employee });
    return ok(res, doc, 'Bonus approved');
  } catch (e) { return serverError(res, e); }
};

// ── Incentives ────────────────────────────────────────────────────────────────

exports.getIncentives = async (req, res) => {
  try {
    const { employee, status, period, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;
    if (period)   filter.period   = period;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Incentive.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName')
        .populate('period', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Incentive.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createIncentive = async (req, res) => {
  try {
    const doc = await Incentive.create(req.body);
    return created(res, doc, 'Incentive created');
  } catch (e) { return serverError(res, e); }
};

exports.getIncentive = async (req, res) => {
  try {
    const doc = await Incentive.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName');
    if (!doc) return notFound(res, 'Incentive');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateIncentive = async (req, res) => {
  try {
    const doc = await Incentive.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Incentive');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Incentive updated');
  } catch (e) { return serverError(res, e); }
};

exports.approveIncentive = async (req, res) => {
  try {
    const doc = await Incentive.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Incentive');
    if (doc.status !== 'draft') return fail(res, 'Incentive is not in draft status');
    doc.status     = 'approved';
    doc.approvedBy = req.admin._id;
    doc.approvedAt = new Date();
    await doc.save();
    return ok(res, doc, 'Incentive approved');
  } catch (e) { return serverError(res, e); }
};

// ── Overtime ──────────────────────────────────────────────────────────────────

exports.getOvertime = async (req, res) => {
  try {
    const { employee, status, period, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;
    if (period)   filter.period   = period;
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Overtime.find(filter)
        .populate('employee', 'firstName lastName employeeCode displayName')
        .populate('period', 'name')
        .sort({ date: -1 })
        .skip(skip).limit(Number(limit)),
      Overtime.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createOvertime = async (req, res) => {
  try {
    const body = { ...req.body };
    body.amount = (body.hours || 0) * (body.rate || 0);
    const doc = await Overtime.create(body);
    return created(res, doc, 'Overtime recorded');
  } catch (e) { return serverError(res, e); }
};

exports.getOvertimeRecord = async (req, res) => {
  try {
    const doc = await Overtime.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode displayName');
    if (!doc) return notFound(res, 'Overtime');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateOvertime = async (req, res) => {
  try {
    const doc = await Overtime.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Overtime');
    Object.assign(doc, req.body);
    if (req.body.hours || req.body.rate) doc.amount = (doc.hours || 0) * (doc.rate || 0);
    await doc.save();
    return ok(res, doc, 'Overtime updated');
  } catch (e) { return serverError(res, e); }
};

exports.approveOvertime = async (req, res) => {
  try {
    const doc = await Overtime.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Overtime');
    if (doc.status !== 'pending') return fail(res, 'Overtime is not in pending status');
    doc.status     = 'approved';
    doc.approvedBy = req.admin._id;
    doc.approvedAt = new Date();
    await doc.save();
    return ok(res, doc, 'Overtime approved');
  } catch (e) { return serverError(res, e); }
};
