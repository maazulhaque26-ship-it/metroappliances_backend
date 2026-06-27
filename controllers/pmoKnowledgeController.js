'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');
const { emit } = require('../utils/socket');

const Lesson   = () => mongoose.model('PMOLessonsLearned');
const Template = () => mongoose.model('PMOTemplate');
const Document = () => mongoose.model('PMODocument');

// ── Lessons Learned ───────────────────────────────────────────────────────────
exports.listLessons = async (req, res) => {
  try {
    const { category, type, phase, portfolio, project, isApproved, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (category)            filter.category   = category;
    if (type)                filter.type       = type;
    if (phase)               filter.phase      = phase;
    if (portfolio)           filter.portfolio  = portfolio;
    if (project)             filter.project    = project;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Lesson().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('reportedBy', 'name').populate('project', 'name').lean(),
      Lesson().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createLesson = async (req, res) => {
  try {
    const doc = await Lesson().create(req.body);
    emit(req.app.locals.io, 'pmo:lesson_learned', { lessonId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getLesson = async (req, res) => {
  try {
    const doc = await Lesson().findOne({ _id: req.params.id, isDeleted: false })
      .populate('reportedBy', 'name').populate('reviewedBy', 'name')
      .populate('project', 'name').populate('portfolio', 'name').lean();
    if (!doc) return notFound(res, 'Lesson Learned');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateLesson = async (req, res) => {
  try {
    const doc = await Lesson().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Lesson Learned');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.approveLesson = async (req, res) => {
  try {
    const doc = await Lesson().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isApproved: true, reviewedBy: req.user._id },
      { new: true }
    );
    if (!doc) return notFound(res, 'Lesson Learned');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteLesson = async (req, res) => {
  try {
    const doc = await Lesson().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Lesson Learned');
    return ok(res, { message: 'Lesson deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.getLessonsReport = async (req, res) => {
  try {
    const [byCategory, byType, byPhase, byImpact] = await Promise.all([
      Lesson().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Lesson().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
      Lesson().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$phase', count: { $sum: 1 } } }]),
      Lesson().aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$impact', count: { $sum: 1 } } }]),
    ]);
    const total = await Lesson().countDocuments({ isDeleted: false });
    const approved = await Lesson().countDocuments({ isDeleted: false, isApproved: true });
    return ok(res, { total, approved, byCategory, byType, byPhase, byImpact });
  } catch (err) { return serverError(res, err); }
};

// ── Templates / Methodology Library ──────────────────────────────────────────
exports.listTemplates = async (req, res) => {
  try {
    const { category, methodology, status, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (category)    filter.category    = category;
    if (methodology) filter.methodology = methodology;
    if (status)      filter.status      = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Template().find(filter).sort({ usageCount: -1, createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('createdBy', 'name').lean(),
      Template().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createTemplate = async (req, res) => {
  try {
    const doc = await Template().create({ ...req.body, createdBy: req.user._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getTemplate = async (req, res) => {
  try {
    const doc = await Template().findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'name').populate('lastUpdatedBy', 'name').lean();
    if (!doc) return notFound(res, 'Template');
    await Template().findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateTemplate = async (req, res) => {
  try {
    const doc = await Template().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { ...req.body, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Template');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const doc = await Template().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Template');
    return ok(res, { message: 'Template deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Document Repository ────────────────────────────────────────────────────────
exports.listDocuments = async (req, res) => {
  try {
    const { documentType, category, status, portfolio, project, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (documentType) filter.documentType = documentType;
    if (category)     filter.category     = category;
    if (status)       filter.status       = status;
    if (portfolio)    filter.portfolio    = portfolio;
    if (project)      filter.project      = project;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Document().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('uploadedBy', 'name').populate('portfolio', 'name').lean(),
      Document().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createDocument = async (req, res) => {
  try {
    const doc = await Document().create({ ...req.body, uploadedBy: req.user._id });
    emit(req.app.locals.io, 'pmo:document_uploaded', { documentId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getDocument = async (req, res) => {
  try {
    const doc = await Document().findOne({ _id: req.params.id, isDeleted: false })
      .populate('uploadedBy', 'name').populate('approvedBy', 'name')
      .populate('portfolio', 'name').populate('project', 'name').lean();
    if (!doc) return notFound(res, 'Document');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateDocument = async (req, res) => {
  try {
    const doc = await Document().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Document');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Document');
    return ok(res, { message: 'Document deleted' });
  } catch (err) { return serverError(res, err); }
};
