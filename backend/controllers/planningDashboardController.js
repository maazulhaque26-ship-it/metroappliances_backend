'use strict';
const ProductionPlan         = require('../models/ProductionPlan');
const MasterProductionSchedule = require('../models/MasterProductionSchedule');
const CapacityPlan           = require('../models/CapacityPlan');
const ProductionOrder        = require('../models/ProductionOrder');
const PlanningScenario       = require('../models/PlanningScenario');
const AuditLog               = require('../models/AuditLog');
const { ok, created, noContent, fail, notFound, serverError } = require('../utils/response');

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const { factory, from, to } = req.query;
    const now   = new Date();
    const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = to   ? new Date(to)   : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const planQ = { isDeleted: false };
    const orderQ = {};
    if (factory) { planQ.factory = factory; orderQ.factory = factory; }

    const [
      totalPlans,
      activePlans,
      releasedPlans,
      totalOrders,
      completedOrders,
      inProgressOrders,
      delayedOrders,
      capacityDocs,
    ] = await Promise.all([
      ProductionPlan.countDocuments(planQ),
      ProductionPlan.countDocuments({ ...planQ, status: { $in: ['approved','released'] } }),
      ProductionPlan.countDocuments({ ...planQ, status: 'released' }),
      ProductionOrder.countDocuments(orderQ),
      ProductionOrder.countDocuments({ ...orderQ, status: 'completed' }),
      ProductionOrder.countDocuments({ ...orderQ, status: 'in_progress' }),
      ProductionOrder.countDocuments({ ...orderQ, status: 'cancelled' }),
      CapacityPlan.find({ isDeleted: false, ...(factory ? { factory } : {}) }).lean(),
    ]);

    const avgUtilization = capacityDocs.length
      ? capacityDocs.reduce((s, d) => s + (d.utilizationPct || 0), 0) / capacityDocs.length
      : 0;

    const bottlenecks = capacityDocs.filter(d => d.isBottleneck).length;
    const onTimePct   = totalOrders > 0 ? +((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    return ok(res, {
      plans:    { total: totalPlans, active: activePlans, released: releasedPlans },
      orders:   { total: totalOrders, completed: completedOrders, inProgress: inProgressOrders, delayed: delayedOrders },
      capacity: { avgUtilization: +avgUtilization.toFixed(1), bottlenecks },
      kpis:     { onTimePct, scheduleAdherence: onTimePct, planFulfillmentRate: releasedPlans > 0 ? +((completedOrders / Math.max(1, releasedPlans)) * 100).toFixed(1) : 0 },
    });
  } catch (e) {
    return serverError(res, e);
  }
};

// ── Schedule Adherence ────────────────────────────────────────────────────────

exports.getScheduleAdherence = async (req, res) => {
  try {
    const { factory, months = 6 } = req.query;
    const q = {};
    if (factory) q.factory = factory;

    const orders = await ProductionOrder.find({
      ...q,
      plannedEndDate: { $exists: true },
    }).select('status plannedEndDate actualEndDate createdAt').lean();

    const byMonth = {};
    for (const o of orders) {
      const key = o.createdAt ? `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2,'0')}` : 'unknown';
      if (!byMonth[key]) byMonth[key] = { total: 0, onTime: 0, late: 0 };
      byMonth[key].total++;
      if (o.status === 'completed') {
        const actualEnd = o.actualEndDate || o.updatedAt;
        if (actualEnd && o.plannedEndDate && actualEnd <= o.plannedEndDate) {
          byMonth[key].onTime++;
        } else {
          byMonth[key].late++;
        }
      }
    }

    const chartData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-+months)
      .map(([month, d]) => ({
        month,
        total:   d.total,
        onTime:  d.onTime,
        late:    d.late,
        adherencePct: d.total > 0 ? +((d.onTime / d.total) * 100).toFixed(1) : 0,
      }));

    const overall = chartData.reduce((acc, d) => {
      acc.total  += d.total;
      acc.onTime += d.onTime;
      return acc;
    }, { total: 0, onTime: 0 });

    return ok(res, {
      chartData,
      overall: { ...overall, adherencePct: overall.total > 0 ? +((overall.onTime / overall.total) * 100).toFixed(1) : 0 },
    });
  } catch (e) {
    return serverError(res, e);
  }
};

// ── Capacity Forecast ─────────────────────────────────────────────────────────

exports.getCapacityForecast = async (req, res) => {
  try {
    const { factory, months = 6 } = req.query;
    const q = { isDeleted: false };
    if (factory) q.factory = factory;

    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + +months);
    q.periodStart = { $lte: end };

    const capacityPlans = await CapacityPlan.find(q)
      .sort({ periodStart: 1 })
      .lean();

    const byPeriod = {};
    for (const cp of capacityPlans) {
      const key = cp.periodStart ? `${cp.periodStart.getFullYear()}-${String(cp.periodStart.getMonth() + 1).padStart(2,'0')}` : 'unknown';
      if (!byPeriod[key]) byPeriod[key] = { available: 0, allocated: 0, total: 0 };
      byPeriod[key].available  += cp.availableCapacity || 0;
      byPeriod[key].allocated  += cp.allocatedCapacity || 0;
      byPeriod[key].total      += cp.totalCapacity     || 0;
    }

    const chartData = Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, d]) => ({
        period,
        availableCapacity: d.available,
        allocatedCapacity: d.allocated,
        totalCapacity:     d.total,
        utilizationPct: d.available > 0 ? +((d.allocated / d.available) * 100).toFixed(1) : 0,
      }));

    return ok(res, chartData);
  } catch (e) {
    return serverError(res, e);
  }
};

// ── Resource Utilization ──────────────────────────────────────────────────────

exports.getResourceUtilization = async (req, res) => {
  try {
    const { factory } = req.query;
    const q = { isDeleted: false };
    if (factory) q.factory = factory;

    const plans = await CapacityPlan.find(q)
      .populate('workCenter', 'name')
      .populate('machine',    'name')
      .lean();

    const byCentre = {};
    for (const p of plans) {
      const name = p.workCenter?.name || 'Unknown';
      if (!byCentre[name]) byCentre[name] = { name, available: 0, allocated: 0, count: 0 };
      byCentre[name].available += p.availableCapacity || 0;
      byCentre[name].allocated += p.allocatedCapacity || 0;
      byCentre[name].count++;
    }

    const chartData = Object.values(byCentre).map(d => ({
      name:              d.name,
      availableCapacity: d.available,
      allocatedCapacity: d.allocated,
      utilizationPct:    d.available > 0 ? +((d.allocated / d.available) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.utilizationPct - a.utilizationPct);

    return ok(res, chartData);
  } catch (e) {
    return serverError(res, e);
  }
};

// ── Planning Scenarios ────────────────────────────────────────────────────────

function auditScenario(req, action, doc, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id, adminName: req.user.name || '', adminEmail: req.user.email || '', adminRole: req.user.role || 'admin',
      action, entity: 'PlanningScenario', entityId: doc._id, entityLabel: doc.name,
      changes: { before, after: doc.toObject ? doc.toObject() : doc },
      ip: req.ip, userAgent: req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.getScenarios = async (req, res) => {
  try {
    const { factory, status } = req.query;
    const q = { isDeleted: false };
    if (factory) q.factory = factory;
    if (status)  q.status  = status;

    const docs = await PlanningScenario.find(q)
      .populate('factory',  'name')
      .populate('basePlan', 'name planNumber')
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, docs);
  } catch (e) {
    return serverError(res, e);
  }
};

exports.createScenario = async (req, res) => {
  try {
    const doc = await PlanningScenario.create({ ...req.body, createdBy: req.user._id });
    auditScenario(req, 'create', doc);
    return created(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.updateScenario = async (req, res) => {
  try {
    const doc = await PlanningScenario.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Scenario not found');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    auditScenario(req, 'update', doc, before);
    return ok(res, doc);
  } catch (e) {
    if (e.name === 'ValidationError') return fail(res, e.message, 422);
    return serverError(res, e);
  }
};

exports.deleteScenario = async (req, res) => {
  try {
    const doc = await PlanningScenario.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Scenario not found');
    doc.isDeleted = true;
    await doc.save();
    auditScenario(req, 'delete', doc);
    return noContent(res);
  } catch (e) {
    return serverError(res, e);
  }
};
