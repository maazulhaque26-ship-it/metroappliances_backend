'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const Risk       = () => mongoose.model('PortfolioRisk');
const KPI        = () => mongoose.model('PortfolioKPI');
const Governance = () => mongoose.model('PortfolioGovernance');
const Approval   = () => mongoose.model('PortfolioApproval');

const SCORE_MAP = { low: 1, medium: 2, high: 3, critical: 4 };
const computeScore = (p, i) => (SCORE_MAP[p] || 1) * (SCORE_MAP[i] || 1);

// ── Risks ─────────────────────────────────────────────────────────────────
exports.listRisks = async (req, res) => {
  try {
    const filter = { portfolio: req.params.id, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;
    const docs = await Risk().find(filter).sort({ riskScore: -1 }).populate('owner', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createRisk = async (req, res) => {
  try {
    const body = { ...req.body, portfolio: req.params.id };
    body.riskScore = computeScore(body.probability, body.impact);
    const doc = await Risk().create(body);
    emit(req.app.locals.io, 'portfolio:risk_created', { portfolioId: req.params.id, riskId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateRisk = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.probability || body.impact) {
      const current = await Risk().findById(req.params.id).lean();
      body.riskScore = computeScore(body.probability || current?.probability, body.impact || current?.impact);
    }
    const doc = await Risk().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Risk');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteRisk = async (req, res) => {
  try {
    const doc = await Risk().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Risk');
    return ok(res, { message: 'Risk deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── KPIs ────────────────────────────────────────────────────────────────────
exports.listKPIs = async (req, res) => {
  try {
    const docs = await KPI().find({ portfolio: req.params.id, isDeleted: false }).sort({ category: 1 }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createKPI = async (req, res) => {
  try {
    const doc = await KPI().create({ ...req.body, portfolio: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateKPI = async (req, res) => {
  try {
    const doc = await KPI().findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'KPI');
    Object.assign(doc, req.body);
    await doc.save();   // recompute RAG status
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteKPI = async (req, res) => {
  try {
    const doc = await KPI().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'KPI');
    return ok(res, { message: 'KPI deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Governance gates ────────────────────────────────────────────────────────
exports.listGovernance = async (req, res) => {
  try {
    const docs = await Governance().find({ portfolio: req.params.id, isDeleted: false })
      .sort({ scheduledDate: 1 }).populate('chair', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createGovernance = async (req, res) => {
  try {
    const doc = await Governance().create({ ...req.body, portfolio: req.params.id });
    emit(req.app.locals.io, 'portfolio:governance_created', { portfolioId: req.params.id, gateId: doc._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateGovernance = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.status && ['passed','passed_with_conditions','failed'].includes(body.status) && !body.reviewDate) {
      body.reviewDate = new Date();
    }
    const doc = await Governance().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Governance gate');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteGovernance = async (req, res) => {
  try {
    const doc = await Governance().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Governance gate');
    return ok(res, { message: 'Gate deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Approval workflow ───────────────────────────────────────────────────────
exports.listApprovals = async (req, res) => {
  try {
    const filter = { portfolio: req.params.id, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;
    const docs = await Approval().find(filter).sort({ createdAt: -1 })
      .populate('requestedBy', 'name').populate('approver', 'name').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createApproval = async (req, res) => {
  try {
    const doc = await Approval().create({ ...req.body, portfolio: req.params.id, requestedBy: req.user?._id });
    emit(req.app.locals.io, 'portfolio:approval_requested', { portfolioId: req.params.id, approvalId: doc._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.decideApproval = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const doc = await Approval().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status, comments, approver: req.user?._id, decidedAt: new Date() },
      { new: true }
    );
    if (!doc) return notFound(res, 'Approval');
    emit(req.app.locals.io, 'portfolio:approval_decided', { approvalId: doc._id, status: doc.status });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteApproval = async (req, res) => {
  try {
    const doc = await Approval().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Approval');
    return ok(res, { message: 'Approval deleted' });
  } catch (err) { return serverError(res, err); }
};
