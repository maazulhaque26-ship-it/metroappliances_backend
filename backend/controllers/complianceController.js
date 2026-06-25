'use strict';
const ComplianceCalendar  = require('../models/ComplianceCalendar');
const ComplianceTask      = require('../models/ComplianceTask');
const TaxAudit            = require('../models/TaxAudit');
const AuditLog            = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Compliance Calendar ───────────────────────────────────────────────────────

exports.getCalendars = async (req, res) => {
  try {
    const { fiscalYear, complianceType } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear)      q.fiscalYear      = fiscalYear;
    if (complianceType)  q.complianceType  = complianceType;
    const data = await ComplianceCalendar.find(q).sort({ complianceType: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createCalendar = async (req, res) => {
  try {
    const doc = await ComplianceCalendar.create(req.body);
    return created(res, doc, 'Compliance calendar created');
  } catch (e) { return serverError(res, e); }
};

exports.updateCalendar = async (req, res) => {
  try {
    const doc = await ComplianceCalendar.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Compliance calendar');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteCalendar = async (req, res) => {
  try {
    const doc = await ComplianceCalendar.findOneAndUpdate({ _id: req.params.id }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Compliance calendar');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};

// ── Compliance Tasks ──────────────────────────────────────────────────────────

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, complianceType, priority, period } = req.query;
    const q = { isDeleted: false };
    if (status)         q.status         = status;
    if (complianceType) q.complianceType = complianceType;
    if (priority)       q.priority       = priority;
    if (period)         q.period         = period;
    const [data, total] = await Promise.all([
      ComplianceTask.find(q).sort({ dueDate: 1 }).skip((page-1)*limit).limit(Number(limit)),
      ComplianceTask.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getTask = async (req, res) => {
  try {
    const doc = await ComplianceTask.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Compliance task');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createTask = async (req, res) => {
  try {
    const doc = await ComplianceTask.create({ ...req.body, createdBy: req.user._id });
    const io = req.app.locals.io;
    if (io) io.emit('tax:compliance_due', { taskId: doc._id, taskNumber: doc.taskNumber, taskName: doc.taskName, dueDate: doc.dueDate });
    return created(res, doc, 'Compliance task created');
  } catch (e) { return serverError(res, e); }
};

exports.updateTask = async (req, res) => {
  try {
    const doc = await ComplianceTask.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Compliance task');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'UPDATE', entity: 'ComplianceTask', entityId: doc._id, entityLabel: doc.taskNumber, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.completeTask = async (req, res) => {
  try {
    const doc = await ComplianceTask.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Compliance task');
    doc.status        = 'completed';
    doc.completedDate = new Date();
    doc.completedBy   = req.user._id;
    if (req.body.notes) doc.notes = req.body.notes;
    await doc.save();
    return ok(res, doc, 'Task marked as completed');
  } catch (e) { return serverError(res, e); }
};

exports.deleteTask = async (req, res) => {
  try {
    const doc = await ComplianceTask.findOneAndUpdate({ _id: req.params.id, status: { $nin: ['completed'] } }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Compliance task');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};

// ── Tax Audits ────────────────────────────────────────────────────────────────

exports.getAudits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, fiscalYear } = req.query;
    const q = { isDeleted: false };
    if (status)     q.status     = status;
    if (fiscalYear) q.fiscalYear = fiscalYear;
    const [data, total] = await Promise.all([
      TaxAudit.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      TaxAudit.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createAudit = async (req, res) => {
  try {
    const doc = await TaxAudit.create({ ...req.body, initiatedBy: req.user._id });
    return created(res, doc, 'Tax audit initiated');
  } catch (e) { return serverError(res, e); }
};

exports.updateAudit = async (req, res) => {
  try {
    const doc = await TaxAudit.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Tax audit');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Upcoming reminders ────────────────────────────────────────────────────────

exports.getReminders = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const now  = new Date();
    const end  = new Date(Date.now() + days * 86400000);
    const tasks = await ComplianceTask.find({
      isDeleted: false,
      status:   { $in: ['pending','in_progress'] },
      dueDate:  { $gte: now, $lte: end },
    }).sort({ dueDate: 1 }).select('taskNumber taskName complianceType period dueDate priority status');
    return ok(res, tasks);
  } catch (e) { return serverError(res, e); }
};
