'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');
const { emit } = require('../utils/socket');

const Portfolio   = () => mongoose.model('Portfolio');
const Program     = () => mongoose.model('Program');
const ProgramProj = () => mongoose.model('ProgramProject');
const Initiative  = () => mongoose.model('StrategicInitiative');

// ── Portfolios ──────────────────────────────────────────────────────────────
exports.listPortfolios = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (category) filter.category = category;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Portfolio().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('owner', 'name').populate('sponsor', 'name').lean(),
      Portfolio().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createPortfolio = async (req, res) => {
  try {
    const doc = await Portfolio().create(req.body);
    emit(req.app.locals.io, 'portfolio:created', { portfolioId: doc._id, name: doc.name });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getPortfolio = async (req, res) => {
  try {
    const doc = await Portfolio().findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name').populate('sponsor', 'name').populate('department', 'name').lean();
    if (!doc) return notFound(res, 'Portfolio');
    const [programs, initiatives] = await Promise.all([
      Program().countDocuments({ portfolio: doc._id, isDeleted: false }),
      Initiative().countDocuments({ portfolio: doc._id, isDeleted: false }),
    ]);
    return ok(res, { ...doc, programCount: programs, initiativeCount: initiatives });
  } catch (err) { return serverError(res, err); }
};

exports.updatePortfolio = async (req, res) => {
  try {
    const doc = await Portfolio().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Portfolio');
    emit(req.app.locals.io, 'portfolio:updated', { portfolioId: doc._id });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deletePortfolio = async (req, res) => {
  try {
    const doc = await Portfolio().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Portfolio');
    return ok(res, { message: 'Portfolio deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.updatePortfolioStatus = async (req, res) => {
  try {
    const doc = await Portfolio().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { status: req.body.status }, { new: true }
    );
    if (!doc) return notFound(res, 'Portfolio');
    emit(req.app.locals.io, 'portfolio:status_changed', { portfolioId: doc._id, status: doc.status });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Programs ────────────────────────────────────────────────────────────────
exports.listPrograms = async (req, res) => {
  try {
    const { portfolio, status, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (portfolio) filter.portfolio = portfolio;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Program().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('portfolio', 'name portfolioCode').populate('programManager', 'name').lean(),
      Program().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createProgram = async (req, res) => {
  try {
    const doc = await Program().create(req.body);
    emit(req.app.locals.io, 'portfolio:program_created', { programId: doc._id, portfolioId: doc.portfolio });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getProgram = async (req, res) => {
  try {
    const doc = await Program().findOne({ _id: req.params.id, isDeleted: false })
      .populate('portfolio', 'name portfolioCode').populate('programManager', 'name').lean();
    if (!doc) return notFound(res, 'Program');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateProgram = async (req, res) => {
  try {
    const doc = await Program().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Program');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteProgram = async (req, res) => {
  try {
    const doc = await Program().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Program');
    return ok(res, { message: 'Program deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Program ↔ Project mapping ───────────────────────────────────────────────
exports.listProgramProjects = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.program) filter.program = req.query.program;
    if (req.query.portfolio) filter.portfolio = req.query.portfolio;
    const docs = await ProgramProj().find(filter)
      .populate('project', 'name projectCode status completionPercent budget')
      .populate('program', 'name programCode').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.mapProject = async (req, res) => {
  try {
    const doc = await ProgramProj().create(req.body);
    emit(req.app.locals.io, 'portfolio:project_mapped', { mappingId: doc._id, programId: doc.program, projectId: doc.project });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateProgramProject = async (req, res) => {
  try {
    const doc = await ProgramProj().findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Mapping');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.unmapProject = async (req, res) => {
  try {
    const doc = await ProgramProj().findByIdAndDelete(req.params.id);
    if (!doc) return notFound(res, 'Mapping');
    return ok(res, { message: 'Project unmapped' });
  } catch (err) { return serverError(res, err); }
};

// ── Strategic Initiatives ───────────────────────────────────────────────────
exports.listInitiatives = async (req, res) => {
  try {
    const { portfolio, status, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (portfolio) filter.portfolio = portfolio;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Initiative().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('portfolio', 'name').populate('owner', 'name').lean(),
      Initiative().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createInitiative = async (req, res) => {
  try {
    const doc = await Initiative().create(req.body);
    emit(req.app.locals.io, 'portfolio:initiative_created', { initiativeId: doc._id, name: doc.name });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateInitiative = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.targetValue && Number(body.targetValue) !== 0 && body.currentValue !== undefined) {
      body.progress = Math.min(100, Math.round((Number(body.currentValue) / Number(body.targetValue)) * 100));
    }
    const doc = await Initiative().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Initiative');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteInitiative = async (req, res) => {
  try {
    const doc = await Initiative().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Initiative');
    return ok(res, { message: 'Initiative deleted' });
  } catch (err) { return serverError(res, err); }
};
