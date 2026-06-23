'use strict';
const MRPRecommendation  = require('../models/MRPRecommendation');
const PurchaseSuggestion = require('../models/PurchaseSuggestion');
const AuditLog           = require('../models/AuditLog');
const { ok, created, paginated, notFound, fail, serverError } = require('../utils/response');

exports.getRecommendations = async (req, res) => {
  try {
    const { page = 1, limit = 20, mrpRun, type, status, priority } = req.query;
    const filter = { isDeleted: false };
    if (mrpRun)   filter.mrpRun   = mrpRun;
    if (type)     filter.type     = type;
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MRPRecommendation.countDocuments(filter);
    const data  = await MRPRecommendation.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .populate('material', 'name sku')
      .populate('mrpRun',  'runNumber')
      .populate('vendor',  'companyName vendorCode');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getRecommendation = async (req, res) => {
  try {
    const doc = await MRPRecommendation.findOne({ _id: req.params.id, isDeleted: false })
      .populate('material',        'name sku')
      .populate('mrpRun',          'runNumber status')
      .populate('vendor',          'companyName vendorCode')
      .populate('factory',         'name')
      .populate('sourceWarehouse', 'name code')
      .populate('targetWarehouse', 'name code')
      .populate('shortage',        'shortageQty severity');
    if (!doc) return notFound(res, 'Recommendation not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.acceptRecommendation = async (req, res) => {
  try {
    const doc = await MRPRecommendation.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Recommendation not found');
    if (doc.status !== 'open') return fail(res, `Recommendation is ${doc.status}`);
    const before = doc.toObject();
    doc.status = 'accepted';
    await doc.save();
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'update', entity: 'MRPRecommendation',
      entityId: doc._id, entityLabel: doc.recommendationNumber,
      changes: { before, after: { status: 'accepted' } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Recommendation accepted');
  } catch (err) { return serverError(res, err); }
};

exports.rejectRecommendation = async (req, res) => {
  try {
    const doc = await MRPRecommendation.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Recommendation not found');
    if (doc.status !== 'open') return fail(res, `Recommendation is ${doc.status}`);
    const before = doc.toObject();
    doc.status          = 'rejected';
    doc.rejectionReason = req.body.rejectionReason || '';
    await doc.save();
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'update', entity: 'MRPRecommendation',
      entityId: doc._id, entityLabel: doc.recommendationNumber,
      changes: { before, after: { status: 'rejected', rejectionReason: doc.rejectionReason } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Recommendation rejected');
  } catch (err) { return serverError(res, err); }
};

exports.getPurchaseSuggestions = async (req, res) => {
  try {
    const { page = 1, limit = 20, mrpRun, status, priority } = req.query;
    const filter = { isDeleted: false };
    if (mrpRun)   filter.mrpRun   = mrpRun;
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await PurchaseSuggestion.countDocuments(filter);
    const data  = await PurchaseSuggestion.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .populate('material',       'name sku')
      .populate('suggestedVendor','companyName vendorCode')
      .populate('mrpRun',         'runNumber');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.approvePurchaseSuggestion = async (req, res) => {
  try {
    const doc = await PurchaseSuggestion.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Purchase suggestion not found');
    if (doc.status !== 'pending') return fail(res, `Suggestion is ${doc.status}`);
    doc.status        = 'approved';
    doc.approvedBy    = req.user?._id;
    doc.approvedByName= req.user?.name || '';
    await doc.save();
    return ok(res, doc, 'Purchase suggestion approved');
  } catch (err) { return serverError(res, err); }
};

exports.rejectPurchaseSuggestion = async (req, res) => {
  try {
    const doc = await PurchaseSuggestion.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Purchase suggestion not found');
    if (!['pending','approved'].includes(doc.status)) return fail(res, `Suggestion is ${doc.status}`);
    doc.status          = 'rejected';
    doc.rejectionReason = req.body.rejectionReason || '';
    await doc.save();
    return ok(res, doc, 'Purchase suggestion rejected');
  } catch (err) { return serverError(res, err); }
};
