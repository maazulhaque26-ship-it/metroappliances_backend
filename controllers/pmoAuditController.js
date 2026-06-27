'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');
const { emit } = require('../utils/socket');

const Audit     = () => mongoose.model('PMOProjectAudit');
const Scorecard = () => mongoose.model('PMOProjectScorecard');

// ── Project Audit ─────────────────────────────────────────────────────────────
exports.listAudits = async (req, res) => {
  try {
    const { status, auditType, project, portfolio, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (auditType) filter.auditType = auditType;
    if (project)   filter.project   = project;
    if (portfolio) filter.portfolio = portfolio;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Audit().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('project', 'name projectCode').populate('auditor', 'name').populate('portfolio', 'name').lean(),
      Audit().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createAudit = async (req, res) => {
  try {
    const doc = await Audit().create(req.body);
    emit(req.app.locals.io, 'pmo:audit_created', { auditId: doc._id, project: doc.project });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getAudit = async (req, res) => {
  try {
    const doc = await Audit().findOne({ _id: req.params.id, isDeleted: false })
      .populate('project', 'name projectCode').populate('auditor', 'name')
      .populate('auditee', 'name').populate('portfolio', 'name').lean();
    if (!doc) return notFound(res, 'Project Audit');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateAudit = async (req, res) => {
  try {
    const doc = await Audit().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Project Audit');
    if (doc.status === 'report_issued') {
      emit(req.app.locals.io, 'pmo:audit_report_issued', { auditId: doc._id, rating: doc.overallRating });
    }
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteAudit = async (req, res) => {
  try {
    const doc = await Audit().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Project Audit');
    return ok(res, { message: 'Audit deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.addFinding = async (req, res) => {
  try {
    const doc = await Audit().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $push: { findings: req.body } },
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Project Audit');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateFinding = async (req, res) => {
  try {
    const doc = await Audit().findOneAndUpdate(
      { _id: req.params.id, 'findings._id': req.params.findingId, isDeleted: false },
      { $set: { 'findings.$': { ...req.body, _id: req.params.findingId } } },
      { new: true }
    );
    if (!doc) return notFound(res, 'Finding');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getAuditSummary = async (req, res) => {
  try {
    const [byRating, byType, byStatus] = await Promise.all([
      Audit().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$overallRating', count: { $sum: 1 } } }]),
      Audit().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$auditType', count: { $sum: 1 } } }]),
      Audit().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const total = await Audit().countDocuments({ isDeleted: false });
    const openFindings = await Audit().aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$findings' },
      { $match: { 'findings.status': 'open' } },
      { $count: 'count' },
    ]);
    return ok(res, { total, openFindings: openFindings[0]?.count || 0, byRating, byType, byStatus });
  } catch (err) { return serverError(res, err); }
};

// ── Project Scorecard ─────────────────────────────────────────────────────────
exports.listScorecards = async (req, res) => {
  try {
    const { project, portfolio, periodType, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (project)    filter.project    = project;
    if (portfolio)  filter.portfolio  = portfolio;
    if (periodType) filter.periodType = periodType;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Scorecard().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('project', 'name projectCode').populate('assessedBy', 'name').lean(),
      Scorecard().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createScorecard = async (req, res) => {
  try {
    const doc = await Scorecard().create({ ...req.body, assessedBy: req.user._id });
    emit(req.app.locals.io, 'pmo:scorecard_created', { scorecardId: doc._id, health: doc.overallHealth });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getScorecard = async (req, res) => {
  try {
    const doc = await Scorecard().findOne({ _id: req.params.id, isDeleted: false })
      .populate('project', 'name projectCode status').populate('assessedBy', 'name')
      .populate('portfolio', 'name').lean();
    if (!doc) return notFound(res, 'Project Scorecard');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateScorecard = async (req, res) => {
  try {
    const doc = await Scorecard().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { ...req.body, assessedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Project Scorecard');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteScorecard = async (req, res) => {
  try {
    const doc = await Scorecard().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Project Scorecard');
    return ok(res, { message: 'Scorecard deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.getScorecardHealthReport = async (req, res) => {
  try {
    const latestScorecards = await Scorecard().aggregate([
      { $match: { isDeleted: false } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$project', latest: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latest' } },
      { $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'projectInfo' } },
      { $unwind: { path: '$projectInfo', preserveNullAndEmpty: true } },
    ]);
    const byHealth = { green: 0, amber: 0, red: 0, not_assessed: 0 };
    for (const sc of latestScorecards) byHealth[sc.overallHealth || 'not_assessed']++;
    const avgSPI = latestScorecards.length
      ? latestScorecards.reduce((s, sc) => s + (sc.spi || 1), 0) / latestScorecards.length
      : 1;
    const avgCPI = latestScorecards.length
      ? latestScorecards.reduce((s, sc) => s + (sc.cpi || 1), 0) / latestScorecards.length
      : 1;
    return ok(res, {
      total: latestScorecards.length,
      byHealth,
      avgSPI: Number(avgSPI.toFixed(2)),
      avgCPI: Number(avgCPI.toFixed(2)),
      scorecards: latestScorecards.map(sc => ({
        project: sc.projectInfo?.name || sc.project,
        overallHealth: sc.overallHealth,
        overallScore: sc.overallScore,
        spi: sc.spi,
        cpi: sc.cpi,
        period: sc.period,
      })),
    });
  } catch (err) { return serverError(res, err); }
};
