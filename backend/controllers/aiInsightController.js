const mongoose = require('mongoose');
const { ok, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const tryM = (name) => { try { return mongoose.model(name); } catch { return null; } };
const safeAgg = async (model, pipeline, fallback = []) => {
  const M = tryM(model); if (!M) return fallback;
  try { return await M.aggregate(pipeline); } catch { return fallback; }
};
const safeCount = async (model, filter = {}) => {
  const M = tryM(model); if (!M) return 0;
  try { return await M.countDocuments(filter); } catch { return 0; }
};

const AIInsight = () => mongoose.model('AIInsight');

const emitInsight = (io, insight) =>
  emit(io, 'ai:insight_generated', { insightId: insight._id, type: insight.type, title: insight.title });

// ── Daily Briefing ─────────────────────────────────────────────────────────────
exports.generateDailyBriefing = async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const period = today.toISOString().slice(0, 10);

    const [orders, revenue, anomalies, lowStock, pendingApprovals, delayedProjects, machinesDown] = await Promise.all([
      safeCount('Order', { createdAt: { $gte: today } }),
      safeAgg('Order', [{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      safeCount('AnomalyDetection', { isResolved: false, severity: { $in: ['critical','high'] } }),
      safeCount('Inventory', { quantity: { $lte: 5, $gt: 0 } }),
      safeCount('LeaveRequest', { status: 'pending' }),
      safeCount('Project', { status: 'delayed' }),
      safeCount('Machine', { status: 'breakdown' }),
    ]);

    const rev = revenue[0]?.total || 0;
    const highlights = [];
    const risks = [];
    const opportunities = [];
    const recommendations = [];

    if (orders > 0) highlights.push(`${orders} orders received today totalling ₹${rev.toLocaleString()}`);
    if (anomalies > 0) { risks.push(`${anomalies} high/critical anomalies require attention`); recommendations.push('Review and resolve critical anomalies immediately'); }
    if (lowStock > 0) { risks.push(`${lowStock} SKUs approaching stockout`); recommendations.push('Initiate emergency replenishment purchase orders'); }
    if (machinesDown > 0) { risks.push(`${machinesDown} machine(s) in breakdown`); recommendations.push('Schedule emergency maintenance'); }
    if (delayedProjects > 0) { risks.push(`${delayedProjects} projects delayed`); recommendations.push('Review delayed project resources and timelines'); }
    if (pendingApprovals > 10) recommendations.push(`Process ${pendingApprovals} pending leave approvals`);
    if (orders > 50) opportunities.push('High order volume — consider capacity planning');
    if (anomalies === 0 && lowStock === 0) highlights.push('All systems operating normally');

    const content = [
      `📅 Daily ERP Briefing — ${period}`,
      '',
      `💰 Revenue: ₹${rev.toLocaleString()} from ${orders} orders`,
      `⚠️  Alerts: ${anomalies} critical anomalies, ${machinesDown} machines down`,
      `📦 Inventory: ${lowStock} SKUs at critical levels`,
      `📋 Projects: ${delayedProjects} delayed`,
      `✅ Approvals: ${pendingApprovals} leave requests pending`,
    ].join('\n');

    const insight = await AIInsight().create({
      type: 'daily_briefing', period, title: `Daily Briefing — ${period}`,
      content, highlights, risks, opportunities, recommendations,
      priority: anomalies > 0 || machinesDown > 0 ? 'high' : 'medium',
      metrics: { orders, revenue: rev, anomalies, lowStock, pendingApprovals, delayedProjects, machinesDown },
      validUntil: new Date(Date.now() + 24 * 3600000),
    });

    emitInsight(req.app?.locals?.io, insight);
    ok(res, insight);
  } catch (e) { serverError(res, e); }
};

// ── Dept Summary ───────────────────────────────────────────────────────────────
exports.generateDeptSummary = async (req, res) => {
  try {
    const { department = 'all' } = req.body || {};
    const period = new Date().toISOString().slice(0, 7);

    const highlights = [];
    const risks = [];
    const metrics = {};

    if (department === 'hr' || department === 'all') {
      const [employees, onLeave, openPositions] = await Promise.all([
        safeCount('Employee', { isActive: true }),
        safeCount('LeaveRequest', { status: 'approved', startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }),
        safeCount('JobOpening', { status: 'open' }),
      ]);
      metrics.hr = { employees, onLeave, openPositions };
      highlights.push(`HR: ${employees} employees, ${onLeave} on leave, ${openPositions} open positions`);
    }
    if (department === 'finance' || department === 'all') {
      const [arTotal, apTotal] = await Promise.all([
        safeAgg('CustomerInvoice', [{ $match: { status: 'overdue' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        safeAgg('VendorInvoice',   [{ $match: { status: { $in: ['pending','approved'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      ]);
      const ar = arTotal[0]?.total || 0;
      const ap = apTotal[0]?.total || 0;
      metrics.finance = { overdueAR: ar, pendingAP: ap, netPosition: ar - ap };
      if (ar > 100000) risks.push(`Finance: ₹${ar.toLocaleString()} overdue AR outstanding`);
      highlights.push(`Finance: AR ₹${ar.toLocaleString()}, AP ₹${ap.toLocaleString()}`);
    }
    if (department === 'operations' || department === 'all') {
      const [lowStock, openPO] = await Promise.all([
        safeCount('Inventory', { quantity: { $lte: 10, $gt: 0 } }),
        safeCount('PurchaseOrder', { status: { $in: ['pending','approved'] } }),
      ]);
      metrics.operations = { lowStock, openPO };
      highlights.push(`Operations: ${lowStock} low-stock SKUs, ${openPO} active POs`);
    }
    if (department === 'manufacturing' || department === 'all') {
      const stats = await safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const byStatus = {};
      stats.forEach(s => { byStatus[s._id] = s.count; });
      metrics.manufacturing = byStatus;
      highlights.push(`Manufacturing: ${byStatus.in_progress || 0} in progress, ${byStatus.delayed || 0} delayed`);
      if (byStatus.delayed > 0) risks.push(`Manufacturing: ${byStatus.delayed} delayed production orders`);
    }

    const content = [
      `📊 Department Summary — ${department.toUpperCase()} — ${period}`,
      '',
      ...highlights.map(h => `• ${h}`),
      '',
      risks.length ? `Risks:\n${risks.map(r => `⚠️  ${r}`).join('\n')}` : '✅ No risks identified',
    ].join('\n');

    const insight = await AIInsight().create({
      type: 'dept_summary', period, department, title: `${department.toUpperCase()} Summary — ${period}`,
      content, highlights, risks,
      priority: risks.length > 0 ? 'high' : 'medium',
      metrics, validUntil: new Date(Date.now() + 8 * 3600000),
    });

    emitInsight(req.app?.locals?.io, insight);
    ok(res, insight);
  } catch (e) { serverError(res, e); }
};

// ── KPI Digest ─────────────────────────────────────────────────────────────────
exports.generateKPIDigest = async (req, res) => {
  try {
    const period = new Date().toISOString().slice(0, 7);
    const mtd    = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [orders, revenue, employees, anomalies, projectsOnTrack, machineUtilization] = await Promise.all([
      safeCount('Order', { createdAt: { $gte: mtd } }),
      safeAgg('Order', [{ $match: { createdAt: { $gte: mtd } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      safeCount('Employee', { isActive: true }),
      safeCount('AnomalyDetection', { createdAt: { $gte: mtd }, isResolved: false }),
      safeCount('Project', { status: 'on_track' }),
      safeAgg('Machine', [{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status','running'] }, 1, 0] } } } }]),
    ]);

    const rev       = revenue[0]?.total || 0;
    const machines  = machineUtilization[0] || { total: 0, active: 0 };
    const utilPct   = machines.total > 0 ? Math.round((machines.active / machines.total) * 100) : 0;

    const kpis = [
      { name: 'MTD Revenue',           value: `₹${rev.toLocaleString()}`,   trend: 'up' },
      { name: 'MTD Orders',            value: orders,                         trend: 'stable' },
      { name: 'Active Employees',      value: employees,                      trend: 'stable' },
      { name: 'Open Anomalies',        value: anomalies,                      trend: anomalies > 5 ? 'up' : 'down' },
      { name: 'Projects On Track',     value: projectsOnTrack,                trend: 'stable' },
      { name: 'Machine Utilization',   value: `${utilPct}%`,                  trend: utilPct > 80 ? 'up' : 'down' },
    ];

    const content = [
      `📈 Weekly KPI Digest — ${period}`,
      '',
      ...kpis.map(k => `${k.name}: ${k.value}`),
    ].join('\n');

    const insight = await AIInsight().create({
      type: 'kpi_digest', period, title: `KPI Digest — ${period}`,
      content, highlights: kpis.map(k => `${k.name}: ${k.value}`),
      priority: 'medium', metrics: { kpis, generatedAt: new Date() },
    });

    emitInsight(req.app?.locals?.io, insight);
    ok(res, insight);
  } catch (e) { serverError(res, e); }
};

// ── Monthly Summary ────────────────────────────────────────────────────────────
exports.generateMonthlySummary = async (req, res) => {
  try {
    const period = new Date().toISOString().slice(0, 7);
    const mtd    = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const prev   = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

    const [currRevenue, prevRevenue, currOrders, hires] = await Promise.all([
      safeAgg('Order', [{ $match: { createdAt: { $gte: mtd } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      safeAgg('Order', [{ $match: { createdAt: { $gte: prev, $lt: mtd } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      safeCount('Order', { createdAt: { $gte: mtd } }),
      safeCount('Employee', { createdAt: { $gte: mtd } }),
    ]);

    const curr = currRevenue[0]?.total || 0;
    const prev_ = prevRevenue[0]?.total || 0;
    const growth = prev_ > 0 ? Math.round(((curr - prev_) / prev_) * 100) : 0;

    const highlights = [
      `Revenue: ₹${curr.toLocaleString()} (${growth >= 0 ? '+' : ''}${growth}% vs previous month)`,
      `Orders: ${currOrders} this month`,
      `New hires: ${hires}`,
    ];

    const content = [
      `📋 Monthly Executive Summary — ${period}`,
      '',
      ...highlights,
    ].join('\n');

    const insight = await AIInsight().create({
      type: 'monthly_summary', period, title: `Monthly Summary — ${period}`,
      content, highlights,
      priority: growth < -10 ? 'high' : 'medium',
      metrics: { revenue: curr, prevRevenue: prev_, growth, orders: currOrders, newHires: hires },
    });

    emitInsight(req.app?.locals?.io, insight);
    ok(res, insight);
  } catch (e) { serverError(res, e); }
};

// ── Risk Summary ───────────────────────────────────────────────────────────────
exports.generateRiskSummary = async (req, res) => {
  try {
    const period = new Date().toISOString().slice(0, 10);

    const [criticalAnomalies, highAnomalies, machinesDown, delayedProjects, overdueInvoices, lowStock] = await Promise.all([
      safeCount('AnomalyDetection', { isResolved: false, severity: 'critical' }),
      safeCount('AnomalyDetection', { isResolved: false, severity: 'high' }),
      safeCount('Machine', { status: 'breakdown' }),
      safeCount('Project', { status: { $in: ['delayed','at_risk'] } }),
      safeAgg('CustomerInvoice', [{ $match: { status: 'overdue' } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }]),
      safeCount('Inventory', { quantity: { $lte: 5 } }),
    ]);

    const inv = overdueInvoices[0] || { count: 0, total: 0 };
    const risks = [];
    if (criticalAnomalies > 0) risks.push({ severity: 'critical', area: 'Operations', risk: `${criticalAnomalies} critical anomalies unresolved` });
    if (machinesDown > 0)       risks.push({ severity: 'critical', area: 'Manufacturing', risk: `${machinesDown} machines in breakdown` });
    if (inv.total > 500000)     risks.push({ severity: 'high',     area: 'Finance', risk: `₹${inv.total.toLocaleString()} overdue invoices` });
    if (delayedProjects > 0)    risks.push({ severity: 'high',     area: 'Projects', risk: `${delayedProjects} delayed/at-risk projects` });
    if (lowStock > 20)          risks.push({ severity: 'medium',   area: 'Inventory', risk: `${lowStock} SKUs at critical stock levels` });
    if (highAnomalies > 0)      risks.push({ severity: 'medium',   area: 'Operations', risk: `${highAnomalies} high-severity anomalies` });

    const content = [
      `🚨 Risk Summary — ${period}`,
      '',
      risks.length > 0 ? risks.map(r => `[${r.severity.toUpperCase()}] ${r.area}: ${r.risk}`).join('\n') : '✅ No significant risks identified',
    ].join('\n');

    const priority = criticalAnomalies > 0 || machinesDown > 0 ? 'critical' : risks.length > 2 ? 'high' : 'medium';

    const insight = await AIInsight().create({
      type: 'risk_summary', period, title: `Risk Summary — ${period}`,
      content, risks: risks.map(r => r.risk),
      priority, metrics: { criticalAnomalies, machinesDown, overdueAR: inv.total, delayedProjects, lowStock },
    });

    emitInsight(req.app?.locals?.io, insight);
    ok(res, insight);
  } catch (e) { serverError(res, e); }
};

// ── Opportunity Summary ────────────────────────────────────────────────────────
exports.generateOpportunitySummary = async (req, res) => {
  try {
    const period = new Date().toISOString().slice(0, 10);

    const [openLeads, forecastRevenue, openPositions, projectsOnTrack] = await Promise.all([
      safeCount('Lead', { status: 'qualified' }),
      safeAgg('AIForecast', [
        { $match: { forecastType: 'revenue', status: 'completed' } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        { $project: { confidence: 1, horizon: 1 } },
      ]),
      safeCount('JobOpening', { status: 'open' }),
      safeCount('Project', { status: 'on_track' }),
    ]);

    const forecast = forecastRevenue[0] || null;
    const opportunities = [];
    if (openLeads > 0) opportunities.push(`${openLeads} qualified leads in pipeline`);
    if (forecast) opportunities.push(`Revenue forecast available (${forecast.confidence}% confidence, ${forecast.horizon}-month horizon)`);
    if (openPositions > 0) opportunities.push(`${openPositions} open positions — talent acquisition opportunity`);
    if (projectsOnTrack > 0) opportunities.push(`${projectsOnTrack} projects on track for delivery`);

    const content = [
      `💡 Opportunity Summary — ${period}`,
      '',
      opportunities.length > 0
        ? opportunities.map(o => `• ${o}`).join('\n')
        : '• Continue monitoring for emerging opportunities',
    ].join('\n');

    const insight = await AIInsight().create({
      type: 'opportunity_summary', period, title: `Opportunity Summary — ${period}`,
      content, opportunities,
      priority: 'medium',
      metrics: { openLeads, openPositions, projectsOnTrack },
    });

    emitInsight(req.app?.locals?.io, insight);
    ok(res, insight);
  } catch (e) { serverError(res, e); }
};

// ── List & CRUD ────────────────────────────────────────────────────────────────
exports.listInsights = async (req, res) => {
  try {
    const { type, isRead, priority, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (type)     filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (priority) filter.priority = priority;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AIInsight().find(filter).sort({ generatedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      AIInsight().countDocuments(filter),
    ]);
    ok(res, { data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { serverError(res, e); }
};

exports.getInsight = async (req, res) => {
  try {
    const insight = await AIInsight().findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() }, { new: true }).lean();
    if (!insight) return notFound(res, 'Insight not found');
    ok(res, insight);
  } catch (e) { serverError(res, e); }
};

exports.deleteInsight = async (req, res) => {
  try {
    await AIInsight().findByIdAndDelete(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};
