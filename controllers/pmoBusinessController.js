'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');
const { emit } = require('../utils/socket');

const BusinessCase = () => mongoose.model('PMOBusinessCase');
const InvRequest   = () => mongoose.model('PMOInvestmentRequest');
const Charter      = () => mongoose.model('PMOProjectCharter');

// ── Business Cases ────────────────────────────────────────────────────────────
exports.listBusinessCases = async (req, res) => {
  try {
    const { status, priority, portfolio, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (priority)  filter.priority  = priority;
    if (portfolio) filter.portfolio = portfolio;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      BusinessCase().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('owner', 'name').populate('sponsor', 'name').populate('portfolio', 'name').lean(),
      BusinessCase().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createBusinessCase = async (req, res) => {
  try {
    const doc = await BusinessCase().create(req.body);
    emit(req.app.locals.io, 'pmo:business_case_created', { caseId: doc._id, title: doc.title });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getBusinessCase = async (req, res) => {
  try {
    const doc = await BusinessCase().findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name').populate('sponsor', 'name')
      .populate('reviewedBy', 'name').populate('portfolio', 'name')
      .populate('program', 'name').populate('project', 'name').lean();
    if (!doc) return notFound(res, 'Business Case');
    const investmentCount = await InvRequest().countDocuments({ businessCase: doc._id, isDeleted: false });
    return ok(res, { ...doc, investmentCount });
  } catch (err) { return serverError(res, err); }
};

exports.updateBusinessCase = async (req, res) => {
  try {
    const doc = await BusinessCase().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Business Case');
    emit(req.app.locals.io, 'pmo:business_case_updated', { caseId: doc._id });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteBusinessCase = async (req, res) => {
  try {
    const doc = await BusinessCase().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Business Case');
    return ok(res, { message: 'Business case deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.approveBusinessCase = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected', 'on_hold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }
    const doc = await BusinessCase().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status, approvedDate: status === 'approved' ? new Date() : undefined, reviewedBy: req.user._id },
      { new: true }
    );
    if (!doc) return notFound(res, 'Business Case');
    emit(req.app.locals.io, 'pmo:business_case_decided', { caseId: doc._id, status });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Investment Requests ────────────────────────────────────────────────────────
exports.listInvestmentRequests = async (req, res) => {
  try {
    const { status, requestType, portfolio, fiscalYear, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)      filter.status      = status;
    if (requestType) filter.requestType = requestType;
    if (portfolio)   filter.portfolio   = portfolio;
    if (fiscalYear)  filter.fiscalYear  = Number(fiscalYear);
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      InvRequest().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('requestedBy', 'name').populate('portfolio', 'name').lean(),
      InvRequest().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createInvestmentRequest = async (req, res) => {
  try {
    const doc = await InvRequest().create(req.body);
    emit(req.app.locals.io, 'pmo:investment_requested', { requestId: doc._id, amount: doc.requestedAmount });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getInvestmentRequest = async (req, res) => {
  try {
    const doc = await InvRequest().findOne({ _id: req.params.id, isDeleted: false })
      .populate('requestedBy', 'name').populate('approvedBy', 'name')
      .populate('portfolio', 'name').populate('project', 'name').lean();
    if (!doc) return notFound(res, 'Investment Request');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateInvestmentRequest = async (req, res) => {
  try {
    const doc = await InvRequest().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Investment Request');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteInvestmentRequest = async (req, res) => {
  try {
    const doc = await InvRequest().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Investment Request');
    return ok(res, { message: 'Investment request deleted' });
  } catch (err) { return serverError(res, err); }
};

exports.decideInvestmentRequest = async (req, res) => {
  try {
    const { status, approvedAmount, remarks } = req.body;
    if (!['approved', 'rejected', 'deferred'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const update = { status, approvedBy: req.user._id };
    if (status === 'approved') { update.approvedAmount = approvedAmount; update.approvedDate = new Date(); }
    const doc = await InvRequest().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, update, { new: true });
    if (!doc) return notFound(res, 'Investment Request');
    emit(req.app.locals.io, 'pmo:investment_decided', { requestId: doc._id, status, approvedAmount: doc.approvedAmount });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Project Charter ───────────────────────────────────────────────────────────
exports.listCharters = async (req, res) => {
  try {
    const { status, portfolio, project, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (portfolio) filter.portfolio = portfolio;
    if (project)   filter.project   = project;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Charter().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('project', 'name projectCode').populate('projectManager', 'name').populate('sponsor', 'name').lean(),
      Charter().countDocuments(filter),
    ]);
    return paginated(res, docs, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createCharter = async (req, res) => {
  try {
    const doc = await Charter().create(req.body);
    emit(req.app.locals.io, 'pmo:charter_created', { charterId: doc._id, project: doc.project });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getCharter = async (req, res) => {
  try {
    const doc = await Charter().findOne({ _id: req.params.id, isDeleted: false })
      .populate('project', 'name projectCode').populate('projectManager', 'name')
      .populate('sponsor', 'name').populate('approvedBy', 'name').lean();
    if (!doc) return notFound(res, 'Project Charter');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateCharter = async (req, res) => {
  try {
    const doc = await Charter().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Project Charter');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.approveCharter = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const doc = await Charter().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status, approvedBy: req.user._id, approvalDate: status === 'approved' ? new Date() : undefined },
      { new: true }
    );
    if (!doc) return notFound(res, 'Project Charter');
    emit(req.app.locals.io, 'pmo:charter_approved', { charterId: doc._id, status });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteCharter = async (req, res) => {
  try {
    const doc = await Charter().findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Project Charter');
    return ok(res, { message: 'Charter deleted' });
  } catch (err) { return serverError(res, err); }
};
