'use strict';
const CapacityPlan   = require('../models/CapacityPlan');
const Machine        = require('../models/Machine');
const WorkCenter     = require('../models/WorkCenter');
const AuditLog       = require('../models/AuditLog');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

function audit(req, action, doc, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id,
      adminName:  req.user.name  || '',
      adminEmail: req.user.email || '',
      adminRole:  req.user.role  || 'admin',
      action,
      entity:      'CapacityPlan',
      entityId:    doc._id,
      entityLabel: `CapacityPlan-${doc._id}`,
      changes:     { before, after: doc.toObject ? doc.toObject() : doc },
      ip:          req.ip,
      userAgent:   req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.createCapacityPlan = async (req, res) => {
  try {
    const doc = await CapacityPlan.create(req.body);
    audit(req, 'create', doc);
    return created(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.getCapacityPlans = async (req, res) => {
  try {
    const { factory, workCenter, machine, planType, page = 1, limit = 20 } = req.query;
    const q = { isDeleted: false };
    if (factory)    q.factory    = factory;
    if (workCenter) q.workCenter = workCenter;
    if (machine)    q.machine    = machine;
    if (planType)   q.planType   = planType;

    const total = await CapacityPlan.countDocuments(q);
    const docs  = await CapacityPlan
      .find(q)
      .populate('factory',    'name code')
      .populate('workCenter', 'name code')
      .populate('machine',    'name serialNumber')
      .sort({ periodStart: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    return paginated(res, docs, { total, page: +page, limit: +limit });
  } catch (e) {
    return serverError(res, e);
  }
};

exports.updateCapacityPlan = async (req, res) => {
  try {
    const doc = await CapacityPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Capacity plan not found');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    // Recompute utilization if capacity fields changed
    if (doc.availableCapacity > 0) {
      doc.utilizationPct = Math.min(100, (doc.allocatedCapacity / doc.availableCapacity) * 100);
    }
    await doc.save();
    audit(req, 'update', doc, before);
    return ok(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.getCapacityAnalysis = async (req, res) => {
  try {
    const { factory, periodStart, periodEnd } = req.query;
    const q = { isDeleted: false };
    if (factory) q.factory = factory;
    if (periodStart || periodEnd) {
      q.periodStart = {};
      if (periodStart) q.periodStart.$gte = new Date(periodStart);
      if (periodEnd)   q.periodStart.$lte = new Date(periodEnd);
    }

    const plans = await CapacityPlan.find(q)
      .populate('factory',    'name')
      .populate('workCenter', 'name')
      .populate('machine',    'name')
      .lean();

    const totalCapacity    = plans.reduce((s, p) => s + (p.totalCapacity    || 0), 0);
    const availableCapacity= plans.reduce((s, p) => s + (p.availableCapacity|| 0), 0);
    const allocatedCapacity= plans.reduce((s, p) => s + (p.allocatedCapacity|| 0), 0);
    const avgUtilization   = plans.length ? plans.reduce((s, p) => s + (p.utilizationPct || 0), 0) / plans.length : 0;
    const bottlenecks      = plans.filter(p => p.isBottleneck);

    return ok(res, {
      summary: { totalCapacity, availableCapacity, allocatedCapacity, avgUtilization: +avgUtilization.toFixed(1), bottleneckCount: bottlenecks.length },
      bottlenecks,
      plans,
    });
  } catch (e) {
    return serverError(res, e);
  }
};

exports.getFactoryCapacity = async (req, res) => {
  try {
    const { factoryId } = req.params;
    const { periodStart, periodEnd } = req.query;
    const q = { factory: factoryId, isDeleted: false };
    if (periodStart || periodEnd) {
      q.periodStart = {};
      if (periodStart) q.periodStart.$gte = new Date(periodStart);
      if (periodEnd)   q.periodStart.$lte = new Date(periodEnd);
    }

    const plans = await CapacityPlan.find(q)
      .populate('workCenter', 'name code')
      .populate('machine',    'name serialNumber')
      .sort({ periodStart: 1 })
      .lean();

    return ok(res, plans);
  } catch (e) {
    return serverError(res, e);
  }
};

exports.getBottlenecks = async (req, res) => {
  try {
    const { factory } = req.query;
    const q = { isBottleneck: true, isDeleted: false };
    if (factory) q.factory = factory;

    const bottlenecks = await CapacityPlan.find(q)
      .populate('factory',    'name')
      .populate('workCenter', 'name')
      .populate('machine',    'name')
      .sort({ utilizationPct: -1 })
      .lean();

    return ok(res, bottlenecks);
  } catch (e) {
    return serverError(res, e);
  }
};
