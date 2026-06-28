'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');
const { emit } = require('../utils/socket');

const RISK  = () => mongoose.model('ProjectRisk');
const ISSUE = () => mongoose.model('ProjectIssue');

const SCORE_MAP = { low: 1, medium: 2, high: 3, critical: 3 };

// ── Risks ─────────────────────────────────────────────────────────────────────

exports.listRisks = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { project: req.params.id, isDeleted: false };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      RISK().find(filter).sort({ riskScore: -1 }).skip(skip).limit(Number(limit))
        .populate('owner', 'name').lean(),
      RISK().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) { return serverError(res, err); }
};

exports.createRisk = async (req, res) => {
  try {
    const body = { ...req.body, project: req.params.id };
    body.riskScore = (SCORE_MAP[body.probability] || 1) * (SCORE_MAP[body.impact] || 1);
    const doc = await RISK().create(body);
    emit(req.app.locals.io, 'project:risk_created', { projectId: req.params.id, riskId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getRisk = async (req, res) => {
  try {
    const doc = await RISK().findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name').lean();
    if (!doc) return notFound(res, 'Risk not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateRisk = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.probability || body.impact) {
      const current = await RISK().findById(req.params.id).lean();
      const prob = body.probability || (current && current.probability) || 'low';
      const impact = body.impact || (current && current.impact) || 'low';
      body.riskScore = (SCORE_MAP[prob] || 1) * (SCORE_MAP[impact] || 1);
    }
    const doc = await RISK().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Risk not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteRisk = async (req, res) => {
  try {
    const doc = await RISK().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Risk not found');
    return ok(res, { message: 'Risk deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Issues ────────────────────────────────────────────────────────────────────

exports.listIssues = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { project: req.params.id, isDeleted: false };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      ISSUE().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('reportedBy', 'name').populate('assignee', 'name').lean(),
      ISSUE().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) { return serverError(res, err); }
};

exports.createIssue = async (req, res) => {
  try {
    const doc = await ISSUE().create({
      ...req.body, project: req.params.id, reportedBy: req.user._id,
    });
    emit(req.app.locals.io, 'project:issue_created', { projectId: req.params.id, issueId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getIssue = async (req, res) => {
  try {
    const doc = await ISSUE().findOne({ _id: req.params.id, isDeleted: false })
      .populate('reportedBy', 'name').populate('assignee', 'name').lean();
    if (!doc) return notFound(res, 'Issue not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateIssue = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.status === 'resolved') body.resolvedAt = new Date();
    const doc = await ISSUE().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Issue not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteIssue = async (req, res) => {
  try {
    const doc = await ISSUE().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Issue not found');
    return ok(res, { message: 'Issue deleted' });
  } catch (err) { return serverError(res, err); }
};
