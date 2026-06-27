'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');
const { emit } = require('../utils/socket');

const MS  = () => mongoose.model('Milestone');
const PM  = () => mongoose.model('ProjectMember');
const PR  = () => mongoose.model('ProjectRole');

// ── Milestones ────────────────────────────────────────────────────────────────

exports.listMilestones = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { project: req.params.id, isDeleted: false };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      MS().find(filter).sort({ dueDate: 1 }).skip(skip).limit(Number(limit))
        .populate('owner', 'name').lean(),
      MS().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) { return serverError(res, err); }
};

exports.createMilestone = async (req, res) => {
  try {
    const doc = await MS().create({ ...req.body, project: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getMilestone = async (req, res) => {
  try {
    const doc = await MS().findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name email').lean();
    if (!doc) return notFound(res, 'Milestone not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateMilestone = async (req, res) => {
  try {
    const doc = await MS().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Milestone not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const doc = await MS().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Milestone not found');
    return ok(res, { message: 'Milestone deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.completeMilestone = async (req, res) => {
  try {
    const doc = await MS().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'achieved', completedDate: new Date() },
      { new: true }
    );
    if (!doc) return notFound(res, 'Milestone not found');
    emit(req.app.locals.io, 'project:milestone_completed', {
      projectId: doc.project, milestoneId: doc._id, name: doc.name,
    });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Members ───────────────────────────────────────────────────────────────────

exports.listMembers = async (req, res) => {
  try {
    const docs = await PM().find({ project: req.params.id, isDeleted: false })
      .populate('employee', 'name email department').populate('role', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.addMember = async (req, res) => {
  try {
    const doc = await PM().create({ ...req.body, project: req.params.id, addedBy: req.user._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateMember = async (req, res) => {
  try {
    const doc = await PM().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Member not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.removeMember = async (req, res) => {
  try {
    const doc = await PM().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Member not found');
    return ok(res, { message: 'Member removed' });
  } catch (err) { return serverError(res, err); }
};

// ── Project Roles ─────────────────────────────────────────────────────────────

exports.listProjectRoles = async (req, res) => {
  try {
    const docs = await PR().find({ isDeleted: false }).sort({ name: 1 }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createProjectRole = async (req, res) => {
  try {
    const doc = await PR().create(req.body);
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateProjectRole = async (req, res) => {
  try {
    const doc = await PR().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Role not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteProjectRole = async (req, res) => {
  try {
    const doc = await PR().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Role not found');
    return ok(res, { message: 'Role deleted' });
  } catch (err) { return serverError(res, err); }
};
