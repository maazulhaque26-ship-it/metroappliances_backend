'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const PerformanceReview = () => mongoose.model('PerformanceReview');
const Appraisal         = () => mongoose.model('Appraisal');

function _audit(req, action, entity, id, label, before, after) {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        admin: req.user._id, adminName: req.user.name,
        adminEmail: req.user.email, adminRole: req.user.role,
        action, entity, entityId: id,
        entityLabel: String(label || '').slice(0, 200),
        changes: { before, after },
        ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
        userAgent: (req.get('User-Agent') || '').slice(0, 300),
      });
    } catch (_) {}
  });
}

function _calcRating(score) {
  if (score >= 90) return 'outstanding';
  if (score >= 75) return 'exceeds_expectations';
  if (score >= 60) return 'meets_expectations';
  if (score >= 45) return 'needs_improvement';
  return 'unsatisfactory';
}

// ── Performance Reviews ───────────────────────────────────────────────────────

exports.createReview = async (req, res) => {
  try {
    const review = await PerformanceReview().create(req.body);
    _audit(req, 'CREATE', 'PerformanceReview', review._id, review.reviewNumber, null, req.body);
    return created(res, review, 'Performance review created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getReviews = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { cycle, employee, status, reviewType } = req.query;
    const filter = { isDeleted: false };
    if (cycle)      filter.cycle      = cycle;
    if (employee)   filter.employee   = employee;
    if (status)     filter.status     = status;
    if (reviewType) filter.reviewType = reviewType;

    const [data, total] = await Promise.all([
      PerformanceReview().find(filter)
        .populate('employee', 'firstName lastName employeeCode department')
        .populate('cycle', 'name cycleCode')
        .populate('reviewer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PerformanceReview().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getReview = async (req, res) => {
  try {
    const review = await PerformanceReview().findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode department designation')
      .populate('cycle', 'name cycleCode status')
      .populate('reviewer', 'name email')
      .lean();
    if (!review) return notFound(res, 'Performance review');
    return ok(res, review);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await PerformanceReview().findOne({ _id: req.params.id, isDeleted: false });
    if (!review) return notFound(res, 'Performance review');
    const before = review.toObject();
    Object.assign(review, req.body);
    await review.save();
    _audit(req, 'UPDATE', 'PerformanceReview', review._id, review.reviewNumber, before, req.body);
    return ok(res, review, 'Review updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.submitSelfReview = async (req, res) => {
  try {
    const review = await PerformanceReview().findOne({ _id: req.params.id, isDeleted: false });
    if (!review) return notFound(res, 'Performance review');
    const { selfScore, strengthsNotes, improvementNotes } = req.body;
    if (selfScore === undefined) return fail(res, 'selfScore is required');
    const before = review.toObject();
    review.selfScore   = selfScore;
    review.status      = 'self_review';
    review.submittedAt = new Date();
    if (strengthsNotes)   review.strengthsNotes   = strengthsNotes;
    if (improvementNotes) review.improvementNotes = improvementNotes;
    await review.save();
    _audit(req, 'SUBMIT_SELF', 'PerformanceReview', review._id, review.reviewNumber, before, { selfScore });
    return ok(res, review, 'Self review submitted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.submitManagerReview = async (req, res) => {
  try {
    const review = await PerformanceReview().findOne({ _id: req.params.id, isDeleted: false });
    if (!review) return notFound(res, 'Performance review');
    const { managerScore, developmentPlan } = req.body;
    if (managerScore === undefined) return fail(res, 'managerScore is required');
    const before = review.toObject();
    review.managerScore  = managerScore;
    review.status        = 'manager_review';
    review.reviewer      = req.user._id;
    if (developmentPlan) review.developmentPlan = developmentPlan;
    await review.save();
    _audit(req, 'SUBMIT_MANAGER', 'PerformanceReview', review._id, review.reviewNumber, before, { managerScore });
    return ok(res, review, 'Manager review submitted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.finalizeReview = async (req, res) => {
  try {
    const review = await PerformanceReview().findOne({ _id: req.params.id, isDeleted: false });
    if (!review) return notFound(res, 'Performance review');
    if (review.selfScore == null || review.managerScore == null) {
      return fail(res, 'Both self and manager scores are required to finalize');
    }
    const before = review.toObject();
    const finalScore = Math.round((review.selfScore * 0.3 + review.managerScore * 0.7) * 100) / 100;
    review.finalScore    = finalScore;
    review.overallRating = _calcRating(finalScore);
    review.status        = 'completed';
    review.completedAt   = new Date();
    await review.save();
    req.io?.emit('hr:review_completed', {
      reviewId: review._id,
      reviewNumber: review.reviewNumber,
      overallRating: review.overallRating,
      finalScore,
    });
    _audit(req, 'FINALIZE', 'PerformanceReview', review._id, review.reviewNumber, before, { finalScore, overallRating: review.overallRating });
    return ok(res, review, 'Review finalized');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Appraisals ────────────────────────────────────────────────────────────────

exports.createAppraisal = async (req, res) => {
  try {
    const appraisal = await Appraisal().create({ ...req.body, approvedBy: req.user._id });
    _audit(req, 'CREATE', 'Appraisal', appraisal._id, appraisal.appraisalNumber, null, req.body);
    return created(res, appraisal, 'Appraisal created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAppraisals = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { cycle, employee, status } = req.query;
    const filter = { isDeleted: false };
    if (cycle)    filter.cycle    = cycle;
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;

    const [data, total] = await Promise.all([
      Appraisal().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('cycle', 'name cycleCode')
        .populate('review', 'reviewNumber finalScore overallRating')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appraisal().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAppraisal = async (req, res) => {
  try {
    const appraisal = await Appraisal().findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode department designation')
      .populate('cycle', 'name cycleCode')
      .populate('review', 'reviewNumber finalScore overallRating')
      .populate('approvedBy', 'name email')
      .lean();
    if (!appraisal) return notFound(res, 'Appraisal');
    return ok(res, appraisal);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateAppraisal = async (req, res) => {
  try {
    const appraisal = await Appraisal().findOne({ _id: req.params.id, isDeleted: false });
    if (!appraisal) return notFound(res, 'Appraisal');
    const before = appraisal.toObject();
    Object.assign(appraisal, req.body);
    await appraisal.save();
    _audit(req, 'UPDATE', 'Appraisal', appraisal._id, appraisal.appraisalNumber, before, req.body);
    return ok(res, appraisal, 'Appraisal updated');
  } catch (err) {
    return serverError(res, err);
  }
};
