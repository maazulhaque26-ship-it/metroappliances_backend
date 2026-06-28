'use strict';
const mongoose = require('mongoose');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const Project         = () => mongoose.model('Project');
const ProjectTemplate = () => mongoose.model('ProjectTemplate');
const ProjectPhase    = () => mongoose.model('ProjectPhase');

async function _audit(req, action, entity, id, label, before, after) {
  setImmediate(async () => {
    try {
      await require('../models/AuditLog').create({
        admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role,
        action, entity, entityId: id, entityLabel: String(label).slice(0, 200),
        changes: { before, after },
        ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
        userAgent: (req.get('User-Agent') || '').slice(0, 300),
      });
    } catch (_) {}
  });
}

const VALID_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const STATUS_TRANSITIONS = {
  planning:  ['active', 'cancelled'],
  active:    ['on_hold', 'completed', 'cancelled'],
  on_hold:   ['active', 'cancelled'],
  completed: [],
  cancelled: [],
};

// ── Projects ──────────────────────────────────────────────────────────────────

exports.listProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [docs, total] = await Promise.all([
      Project().find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('projectManager', 'name email')
        .lean(),
      Project().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createProject = async (req, res) => {
  try {
    const doc = await Project().create(req.body);
    emit(req.app.locals.io, 'project:created', { projectId: doc._id, name: doc.name });
    _audit(req, 'CREATE', 'Project', doc._id, doc.name, null, doc);
    return created(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getProject = async (req, res) => {
  try {
    const doc = await Project().findOne({ _id: req.params.id, isDeleted: false })
      .populate('projectManager', 'name email')
      .populate('template', 'name')
      .lean();
    if (!doc) return notFound(res, 'Project not found');
    const [phases, membersCount] = await Promise.all([
      mongoose.model('ProjectPhase').find({ project: doc._id, isDeleted: false }).sort({ order: 1 }).lean(),
      mongoose.model('ProjectMember').countDocuments({ project: doc._id, isDeleted: false }),
    ]);
    return ok(res, { ...doc, phases, membersCount });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateProject = async (req, res) => {
  try {
    const doc = await Project().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Project not found');
    _audit(req, 'UPDATE', 'Project', doc._id, doc.name, null, doc);
    return ok(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const doc = await Project().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!doc) return notFound(res, 'Project not found');
    _audit(req, 'DELETE', 'Project', doc._id, doc.name, doc, null);
    return ok(res, { message: 'Project deleted' });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) return fail(res, 'Invalid status');
    const doc = await Project().findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Project not found');
    const allowed = STATUS_TRANSITIONS[doc.status] || [];
    if (!allowed.includes(status)) {
      return fail(res, `Cannot transition from '${doc.status}' to '${status}'`);
    }
    doc.status = status;
    if (status === 'completed') doc.actualEndDate = new Date();
    if (status === 'active' && !doc.actualStartDate) doc.actualStartDate = new Date();
    await doc.save();
    _audit(req, 'STATUS_CHANGE', 'Project', doc._id, doc.name, { status: doc.status }, { status });
    return ok(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Templates ─────────────────────────────────────────────────────────────────

exports.listTemplates = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { isDeleted: false };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const [docs, total] = await Promise.all([
      ProjectTemplate().find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
      ProjectTemplate().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const doc = await ProjectTemplate().create(req.body);
    return created(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const doc = await ProjectTemplate().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Template not found');
    return ok(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const doc = await ProjectTemplate().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!doc) return notFound(res, 'Template not found');
    return ok(res, { message: 'Template deleted' });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Phases ────────────────────────────────────────────────────────────────────

exports.listPhases = async (req, res) => {
  try {
    const project = req.params.id;
    const docs = await ProjectPhase().find({ project, isDeleted: false }).sort({ order: 1 }).lean();
    return ok(res, docs);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createPhase = async (req, res) => {
  try {
    const project = await Project().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!project) return notFound(res, 'Project not found');
    const doc = await ProjectPhase().create({ ...req.body, project: req.params.id });
    return created(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updatePhase = async (req, res) => {
  try {
    const doc = await ProjectPhase().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Phase not found');
    return ok(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deletePhase = async (req, res) => {
  try {
    const doc = await ProjectPhase().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!doc) return notFound(res, 'Phase not found');
    return ok(res, { message: 'Phase deleted' });
  } catch (err) {
    return serverError(res, err);
  }
};
