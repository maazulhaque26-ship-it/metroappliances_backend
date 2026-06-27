const mongoose = require('mongoose');
const { ok, created, notFound, serverError, fail } = require('../utils/response');
const { emit } = require('../utils/socket');

const tryM = (name) => { try { return mongoose.model(name); } catch { return null; } };
const safeAgg = async (model, pipeline, fallback = []) => {
  const M = tryM(model);
  if (!M) return fallback;
  try { return await M.aggregate(pipeline); } catch { return fallback; }
};
const safeCount = async (model, filter = {}) => {
  const M = tryM(model);
  if (!M) return 0;
  try { return await M.countDocuments(filter); } catch { return 0; }
};

const BIKPITarget = () => mongoose.model('BIKPITarget');
const BIAlert     = () => mongoose.model('BIAlert');

const ytdStart = () => new Date(new Date().getFullYear(), 0, 1);
const mtdStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// ── KPI computation helpers ───────────────────────────────────────────────────
const computeRevenue = async (since) => {
  const r = await safeAgg('Order', [
    { $match: { status: { $in: ['delivered','completed','processing'] }, createdAt: { $gte: since } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  return r[0]?.total || 0;
};

const computeHeadcount = async () => safeCount('Employee', { isActive: true });

const computeOTIF = async () => {
  const [total, onTime] = await Promise.all([
    safeCount('Shipment', { status: 'delivered' }),
    safeCount('Shipment', { status: 'delivered', deliveredOnTime: true }),
  ]);
  return total > 0 ? Math.round((onTime / total) * 100) : 0;
};

const computeOEE = async () => {
  const r = await safeAgg('ProductionOrder', [
    { $match: { status: 'completed' } },
    { $group: { _id: null, planned: { $sum: '$plannedQuantity' }, actual: { $sum: '$completedQuantity' }, rejected: { $sum: '$rejectedQuantity' } } }
  ]);
  const d = r[0];
  if (!d || !d.planned) return 0;
  const quality = d.actual > 0 ? (d.actual - (d.rejected || 0)) / d.actual : 1;
  const performance = d.actual / d.planned;
  return Math.round(quality * performance * 100);
};

const computeServiceSLA = async () => {
  const [total, onTime] = await Promise.all([
    safeCount('ServiceRequest', { status: 'resolved' }),
    safeCount('ServiceRequest', { status: 'resolved', resolvedWithinSLA: true }),
  ]);
  return total > 0 ? Math.round((onTime / total) * 100) : 0;
};

const computeProjectCompletion = async () => {
  const [total, completed] = await Promise.all([
    safeCount('Project', {}),
    safeCount('Project', { status: 'completed' }),
  ]);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const computeVendorOTIF = async () => {
  const [total, onTime] = await Promise.all([
    safeCount('PurchaseOrder', { status: 'completed' }),
    safeCount('PurchaseOrder', { status: 'completed', deliveredOnTime: true }),
  ]);
  return total > 0 ? Math.round((onTime / total) * 100) : 0;
};

const computeTrainingCompletion = async () => {
  const r = await safeAgg('TrainingEnrollment', [
    { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } } } }
  ]);
  const d = r[0];
  return d?.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
};

const computeInventoryTurns = async () => {
  const [cogs, inv] = await Promise.all([
    safeAgg('VendorInvoice', [{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    safeAgg('Inventory', [{ $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $ifNull: ['$unitCost', 0] }] } } } }]),
  ]);
  const cogsVal = cogs[0]?.total || 0;
  const invVal  = inv[0]?.total || 1;
  return invVal > 0 ? +(cogsVal / invVal).toFixed(2) : 0;
};

const computeCustomerSatisfaction = async () => {
  const r = await safeAgg('Review', [{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  return r[0]?.avg ? +r[0].avg.toFixed(1) : 0;
};

const KPI_DEFINITIONS = {
  revenue:              { label: 'Revenue (YTD)',            unit: 'INR', compute: () => computeRevenue(ytdStart()) },
  revenue_mtd:          { label: 'Revenue (MTD)',            unit: 'INR', compute: () => computeRevenue(mtdStart()) },
  headcount:            { label: 'Active Headcount',         unit: 'employees', compute: computeHeadcount },
  otif:                 { label: 'OTIF',                     unit: '%', compute: computeOTIF },
  oee:                  { label: 'OEE',                      unit: '%', compute: computeOEE },
  service_sla:          { label: 'Service SLA',              unit: '%', compute: computeServiceSLA },
  project_completion:   { label: 'Project Completion Rate',  unit: '%', compute: computeProjectCompletion },
  vendor_otif:          { label: 'Vendor OTIF',              unit: '%', compute: computeVendorOTIF },
  training_completion:  { label: 'Training Completion',      unit: '%', compute: computeTrainingCompletion },
  inventory_turns:      { label: 'Inventory Turns',          unit: 'x', compute: computeInventoryTurns },
  customer_satisfaction:{ label: 'Customer Satisfaction',    unit: '/5', compute: computeCustomerSatisfaction },
  open_orders:          { label: 'Pending Orders',           unit: 'count', compute: () => safeCount('Order', { status: { $in: ['pending','confirmed','processing'] } }) },
  open_service:         { label: 'Open Service Tickets',     unit: 'count', compute: () => safeCount('ServiceRequest', { status: { $in: ['open','in_progress'] } }) },
  active_projects:      { label: 'Active Projects',          unit: 'count', compute: () => safeCount('Project', { status: { $in: ['active','in_progress'] } }) },
  open_pos:             { label: 'Open Purchase Orders',     unit: 'count', compute: () => safeCount('PurchaseOrder', { status: { $nin: ['completed','cancelled'] } }) },
  active_production:    { label: 'Active Production Orders', unit: 'count', compute: () => safeCount('ProductionOrder', { status: { $nin: ['completed','cancelled'] } }) },
  open_maintenance:     { label: 'Open Maintenance WOs',     unit: 'count', compute: () => safeCount('MaintenanceWorkOrder', { status: { $in: ['open','in_progress'] } }) },
  active_assets:        { label: 'Active Assets',            unit: 'count', compute: () => safeCount('Asset', { status: 'active' }) },
  pending_invoices:     { label: 'Pending AR Invoices',      unit: 'count', compute: () => safeCount('CustomerInvoice', { status: { $in: ['pending','overdue'] } }) },
  document_count:       { label: 'Documents in DMS',         unit: 'count', compute: () => safeCount('Document', { isDeleted: false }) },
};

exports.getAllKPIs = async (req, res) => {
  try {
    const entries = await Promise.all(
      Object.entries(KPI_DEFINITIONS).map(async ([key, def]) => {
        const value = await def.compute().catch(() => 0);
        const target = await BIKPITarget().findOne({ kpiName: key, isActive: true }).sort({ createdAt: -1 }).lean().catch(() => null);
        return { key, label: def.label, unit: def.unit, value, target: target?.targetValue || null, targetCode: target?.targetCode || null };
      })
    );
    emit(req.app.locals.io, 'bi:kpi_updated', { count: entries.length });
    ok(res, entries);
  } catch (e) { serverError(res, e); }
};

exports.getKPI = async (req, res) => {
  try {
    const { name } = req.params;
    const def = KPI_DEFINITIONS[name];
    if (!def) return notFound(res, `KPI '${name}' not found`);
    const value  = await def.compute().catch(() => 0);
    const target = await BIKPITarget().findOne({ kpiName: name, isActive: true }).sort({ createdAt: -1 }).lean().catch(() => null);
    ok(res, { key: name, label: def.label, unit: def.unit, value, target: target?.targetValue || null });
  } catch (e) { serverError(res, e); }
};

exports.getKPITrend = async (req, res) => {
  try {
    const { name } = req.params;
    const { months = 6 } = req.query;
    if (!KPI_DEFINITIONS[name]) return notFound(res, `KPI '${name}' not found`);
    const m = Math.min(parseInt(months), 24);
    const since = new Date(); since.setMonth(since.getMonth() - m + 1); since.setDate(1);
    const trend = await safeAgg('Order', [
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, value: { $sum: '$totalAmount' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);
    ok(res, { key: name, trend });
  } catch (e) { serverError(res, e); }
};

exports.getKPITargets = async (req, res) => {
  try {
    const targets = await BIKPITarget().find({ isActive: true }).sort({ kpiName: 1 }).lean();
    ok(res, targets);
  } catch (e) { serverError(res, e); }
};

exports.createKPITarget = async (req, res) => {
  try {
    const t = await BIKPITarget().create({ ...req.body, setBy: req.user?._id });
    created(res, t);
  } catch (e) { serverError(res, e); }
};

exports.updateKPITarget = async (req, res) => {
  try {
    const t = await BIKPITarget().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) return notFound(res, 'Target not found');
    ok(res, t);
  } catch (e) { serverError(res, e); }
};

exports.deleteKPITarget = async (req, res) => {
  try {
    await BIKPITarget().findByIdAndDelete(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.checkAlerts = async (req, res) => {
  try {
    const alerts = await BIAlert().find({ isActive: true }).lean();
    const triggered = [];
    for (const alert of alerts) {
      const def = KPI_DEFINITIONS[alert.kpiName];
      if (!def) continue;
      const value = await def.compute().catch(() => 0);
      let fire = false;
      if (alert.condition === 'above'        && value > alert.threshold)  fire = true;
      if (alert.condition === 'below'        && value < alert.threshold)  fire = true;
      if (alert.condition === 'equals'       && value === alert.threshold) fire = true;
      if (fire) {
        await BIAlert().findByIdAndUpdate(alert._id, { lastTriggered: new Date(), lastValue: value, $inc: { triggerCount: 1 } });
        if (alert.notifyVia?.includes('socket')) emit(req.app.locals.io, 'bi:alert_triggered', { alert, value });
        triggered.push({ ...alert, value });
      }
    }
    ok(res, { checked: alerts.length, triggered: triggered.length, details: triggered });
  } catch (e) { serverError(res, e); }
};
