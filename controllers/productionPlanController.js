'use strict';
const ProductionPlan = require('../models/ProductionPlan');
const AuditLog      = require('../models/AuditLog');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

function audit(req, action, plan, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id,
      adminName:  req.user.name  || '',
      adminEmail: req.user.email || '',
      adminRole:  req.user.role  || 'admin',
      action,
      entity:      'ProductionPlan',
      entityId:    plan._id,
      entityLabel: plan.planNumber || plan.name,
      changes:     { before, after: plan.toObject ? plan.toObject() : plan },
      ip:          req.ip,
      userAgent:   req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.createPlan = async (req, res) => {
  try {
    const plan = await ProductionPlan.create(req.body);
    audit(req, 'create', plan);
    return created(res, plan);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.getPlans = async (req, res) => {
  try {
    const { factory, status, planType, search, page = 1, limit = 20 } = req.query;
    const q = { isDeleted: false };
    if (factory)  q.factory  = factory;
    if (status)   q.status   = status;
    if (planType) q.planType = planType;
    if (search)   q.name     = { $regex: search, $options: 'i' };

    const total = await ProductionPlan.countDocuments(q);
    const plans = await ProductionPlan
      .find(q)
      .populate('factory', 'name code')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    return paginated(res, plans, { total, page: +page, limit: +limit });
  } catch (e) {
    return serverError(res, e);
  }
};

exports.getPlan = async (req, res) => {
  try {
    const plan = await ProductionPlan
      .findOne({ _id: req.params.id, isDeleted: false })
      .populate('factory', 'name code location')
      .populate('productionOrders', 'orderNumber status plannedQty')
      .populate('submittedBy reviewedBy approvedBy releasedBy cancelledBy', 'name email');
    if (!plan) return notFound(res, 'Production plan not found');
    return ok(res, plan);
  } catch (e) {
    return serverError(res, e);
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await ProductionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return notFound(res, 'Production plan not found');
    if (!['draft','submitted'].includes(plan.status)) {
      return fail(res, 'Only draft or submitted plans can be edited', 422);
    }
    const before = plan.toObject();
    Object.assign(plan, req.body);
    await plan.save();
    audit(req, 'update', plan, before);
    return ok(res, plan);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await ProductionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return notFound(res, 'Production plan not found');
    if (['released'].includes(plan.status)) {
      return fail(res, 'Released plans cannot be deleted', 422);
    }
    plan.isDeleted = true;
    await plan.save();
    audit(req, 'delete', plan);
    return noContent(res);
  } catch (e) {
    return serverError(res, e);
  }
};

async function transition(req, res, fromStatuses, toStatus, fields = {}) {
  try {
    const plan = await ProductionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return notFound(res, 'Production plan not found');
    if (!fromStatuses.includes(plan.status)) {
      return fail(res, `Cannot transition from '${plan.status}' to '${toStatus}'`, 422);
    }
    const before = plan.toObject();
    plan.status = toStatus;
    Object.assign(plan, fields);
    plan.history.push({
      status:        toStatus,
      note:          req.body.note || '',
      changedBy:     req.user._id,
      changedByName: req.user.name || '',
    });
    await plan.save();
    audit(req, toStatus, plan, before);
    return ok(res, plan);
  } catch (e) {
    return serverError(res, e);
  }
}

exports.submitPlan  = (req, res) => transition(req, res, ['draft'],      'submitted', { submittedBy: req.user._id, submittedAt: new Date() });
exports.reviewPlan  = (req, res) => transition(req, res, ['submitted'],  'reviewed',  { reviewedBy:  req.user._id, reviewedAt:  new Date() });
exports.approvePlan = (req, res) => transition(req, res, ['reviewed'],   'approved',  { approvedBy:  req.user._id, approvedAt:  new Date() });
exports.releasePlan = (req, res) => transition(req, res, ['approved'],   'released',  { releasedBy:  req.user._id, releasedAt:  new Date() });
exports.cancelPlan  = (req, res) => transition(req, res, ['draft','submitted','reviewed','approved'], 'cancelled', { cancelledBy: req.user._id, cancelledAt: new Date() });

exports.clonePlan = async (req, res) => {
  try {
    const source = await ProductionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!source) return notFound(res, 'Production plan not found');

    const { _id, planNumber, createdAt, updatedAt, submittedBy, submittedAt, reviewedBy, reviewedAt,
            approvedBy, approvedAt, releasedBy, releasedAt, cancelledBy, cancelledAt, history, ...rest } = source.toObject();

    const clone = await ProductionPlan.create({
      ...rest,
      name:    `${source.name} (Copy)`,
      status:  'draft',
      version: source.version + 1,
      history: [],
    });
    audit(req, 'clone', clone);
    return created(res, clone);
  } catch (e) {
    return serverError(res, e);
  }
};
