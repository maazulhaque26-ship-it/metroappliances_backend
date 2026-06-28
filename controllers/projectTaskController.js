'use strict';
const mongoose = require('mongoose');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const PT  = () => mongoose.model('ProjectTask');
const ST  = () => mongoose.model('SubTask');
const TC  = () => mongoose.model('TaskComment');
const TA  = () => mongoose.model('TaskAttachment');
const TD  = () => mongoose.model('ProjectDependency');

function _audit(req, action, entity, id, label) {
  setImmediate(async () => {
    try {
      await require('../models/AuditLog').create({
        admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role,
        action, entity, entityId: id, entityLabel: String(label).slice(0, 200),
        ip: (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
        userAgent: (req.get('User-Agent') || '').slice(0, 300),
      });
    } catch (_) {}
  });
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

exports.listTasks = async (req, res) => {
  try {
    const { status, assignee, priority, page = 1, limit = 50 } = req.query;
    const filter = { project: req.params.id, isDeleted: false, parentTask: { $exists: false } };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      PT().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('assignee', 'name').populate('milestone', 'name').lean(),
      PT().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) { return serverError(res, err); }
};

exports.createTask = async (req, res) => {
  try {
    const doc = await PT().create({ ...req.body, project: req.params.id });
    emit(req.app.locals.io, 'project:task_created', { projectId: req.params.id, taskId: doc._id, title: doc.title });
    _audit(req, 'CREATE', 'ProjectTask', doc._id, doc.title);
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getTask = async (req, res) => {
  try {
    const doc = await PT().findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignee', 'name email').populate('phase', 'name').populate('milestone', 'name').lean();
    if (!doc) return notFound(res, 'Task not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateTask = async (req, res) => {
  try {
    const doc = await PT().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Task not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteTask = async (req, res) => {
  try {
    const doc = await PT().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Task not found');
    return ok(res, { message: 'Task deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
    if (!VALID.includes(status)) return fail(res, 'Invalid status');
    const doc = await PT().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status, ...(status === 'done' ? { completedDate: new Date() } : {}) },
      { new: true }
    );
    if (!doc) return notFound(res, 'Task not found');
    if (status === 'done') {
      emit(req.app.locals.io, 'project:task_completed', { projectId: doc.project, taskId: doc._id, title: doc.title });
    }
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── SubTasks ──────────────────────────────────────────────────────────────────

exports.listSubTasks = async (req, res) => {
  try {
    const docs = await ST().find({ task: req.params.id, isDeleted: false }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createSubTask = async (req, res) => {
  try {
    const doc = await ST().create({ ...req.body, task: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateSubTask = async (req, res) => {
  try {
    const doc = await ST().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'SubTask not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteSubTask = async (req, res) => {
  try {
    const doc = await ST().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'SubTask not found');
    return ok(res, { message: 'SubTask deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Comments ──────────────────────────────────────────────────────────────────

exports.listComments = async (req, res) => {
  try {
    const docs = await TC().find({ task: req.params.id, isDeleted: false })
      .sort({ createdAt: 1 }).populate('author', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.addComment = async (req, res) => {
  try {
    const doc = await TC().create({ task: req.params.id, author: req.user._id, content: req.body.content });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteComment = async (req, res) => {
  try {
    const doc = await TC().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Comment not found');
    return ok(res, { message: 'Comment deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Attachments ───────────────────────────────────────────────────────────────

exports.addAttachment = async (req, res) => {
  try {
    const doc = await TA().create({ ...req.body, task: req.params.id, uploadedBy: req.user._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const doc = await TA().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Attachment not found');
    return ok(res, { message: 'Attachment deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Dependencies ──────────────────────────────────────────────────────────────

exports.listDependencies = async (req, res) => {
  try {
    const docs = await TD().find({ task: req.params.id, isDeleted: false })
      .populate('dependsOn', 'title taskCode').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.addDependency = async (req, res) => {
  try {
    const doc = await TD().create(req.body);
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.removeDependency = async (req, res) => {
  try {
    const doc = await TD().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Dependency not found');
    return ok(res, { message: 'Dependency removed' });
  } catch (err) { return serverError(res, err); }
};
