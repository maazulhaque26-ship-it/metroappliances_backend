'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');
const { emit } = require('../utils/socket');

const Board      = () => mongoose.model('PMOGovernanceBoard');
const Decision   = () => mongoose.model('PMODecisionLog');
const Committee  = () => mongoose.model('PMOSteeringCommittee');
const Compliance = () => mongoose.model('PMOComplianceItem');

// ── Governance Boards ────────────────────────────────────────────────────────
exports.listBoards = async (req, res) => {
  try {
    const { status, boardType, portfolio, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (boardType) filter.boardType = boardType;
    if (portfolio) filter.portfolio = portfolio;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Board().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('chair', 'name').populate('portfolio', 'name').lean(),
      Board().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createBoard = async (req, res) => {
  try {
    const doc = await Board().create(req.body);
    emit(req.app.locals.io, 'pmo:board_created', { boardId: doc._id, name: doc.name });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getBoard = async (req, res) => {
  try {
    const doc = await Board().findOne({ _id: req.params.id, isDeleted: false })
      .populate('chair', 'name').populate('portfolio', 'name').populate('members.user', 'name').lean();
    if (!doc) return notFound(res, 'Governance Board');
    const decisionCount = await Decision().countDocuments({ board: doc._id, isDeleted: false });
    return ok(res, { ...doc, decisionCount });
  } catch (err) { return serverError(res, err); }
};

exports.updateBoard = async (req, res) => {
  try {
    const doc = await Board().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Governance Board');
    emit(req.app.locals.io, 'pmo:board_updated', { boardId: doc._id });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteBoard = async (req, res) => {
  try {
    const doc = await Board().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Governance Board');
    return ok(res, { message: 'Board deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Decision Log ─────────────────────────────────────────────────────────────
exports.listDecisions = async (req, res) => {
  try {
    const { status, decisionType, portfolio, board, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)       filter.status       = status;
    if (decisionType) filter.decisionType = decisionType;
    if (portfolio)    filter.portfolio    = portfolio;
    if (board)        filter.board        = board;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Decision().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('decisionMaker', 'name').populate('portfolio', 'name').populate('board', 'name').lean(),
      Decision().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createDecision = async (req, res) => {
  try {
    const doc = await Decision().create(req.body);
    emit(req.app.locals.io, 'pmo:decision_logged', { decisionId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getDecision = async (req, res) => {
  try {
    const doc = await Decision().findOne({ _id: req.params.id, isDeleted: false })
      .populate('decisionMaker', 'name').populate('owner', 'name')
      .populate('portfolio', 'name').populate('program', 'name')
      .populate('project', 'name').populate('board', 'name').lean();
    if (!doc) return notFound(res, 'Decision');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateDecision = async (req, res) => {
  try {
    const doc = await Decision().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Decision');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteDecision = async (req, res) => {
  try {
    const doc = await Decision().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Decision');
    return ok(res, { message: 'Decision deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Steering Committee ────────────────────────────────────────────────────────
exports.listCommittees = async (req, res) => {
  try {
    const { status, portfolio, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (portfolio) filter.portfolio = portfolio;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Committee().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('chair', 'name').populate('portfolio', 'name').lean(),
      Committee().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createCommittee = async (req, res) => {
  try {
    const doc = await Committee().create(req.body);
    emit(req.app.locals.io, 'pmo:committee_created', { committeeId: doc._id, name: doc.name });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getCommittee = async (req, res) => {
  try {
    const doc = await Committee().findOne({ _id: req.params.id, isDeleted: false })
      .populate('chair', 'name').populate('secretary', 'name')
      .populate('members.user', 'name').populate('portfolio', 'name').lean();
    if (!doc) return notFound(res, 'Steering Committee');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateCommittee = async (req, res) => {
  try {
    const doc = await Committee().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Steering Committee');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteCommittee = async (req, res) => {
  try {
    const doc = await Committee().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Steering Committee');
    return ok(res, { message: 'Committee deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.addMeeting = async (req, res) => {
  try {
    const doc = await Committee().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $push: { meetings: req.body } },
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Steering Committee');
    emit(req.app.locals.io, 'pmo:meeting_scheduled', { committeeId: doc._id });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Compliance Tracking ───────────────────────────────────────────────────────
exports.listCompliance = async (req, res) => {
  try {
    const { status, category, severity, portfolio, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (category)  filter.category  = category;
    if (severity)  filter.severity  = severity;
    if (portfolio) filter.portfolio = portfolio;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Compliance().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('owner', 'name').populate('portfolio', 'name').lean(),
      Compliance().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createCompliance = async (req, res) => {
  try {
    const doc = await Compliance().create(req.body);
    emit(req.app.locals.io, 'pmo:compliance_created', { complianceId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getCompliance = async (req, res) => {
  try {
    const doc = await Compliance().findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name').populate('reviewer', 'name').populate('portfolio', 'name').lean();
    if (!doc) return notFound(res, 'Compliance Item');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateCompliance = async (req, res) => {
  try {
    const doc = await Compliance().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Compliance Item');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteCompliance = async (req, res) => {
  try {
    const doc = await Compliance().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Compliance Item');
    return ok(res, { message: 'Compliance item deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.getComplianceSummary = async (req, res) => {
  try {
    const [byStatus, bySeverity, byCategory] = await Promise.all([
      Compliance().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Compliance().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Compliance().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    const total = await Compliance().countDocuments({ isDeleted: false });
    const nonCompliant = await Compliance().countDocuments({ isDeleted: false, status: 'non_compliant' });
    const critical = await Compliance().countDocuments({ isDeleted: false, severity: 'critical', status: { $ne: 'compliant' } });
    return ok(res, { total, nonCompliant, critical, byStatus, bySeverity, byCategory });
  } catch (err) { return serverError(res, err); }
};
