const mongoose = require('mongoose');
const { ok, created, notFound, serverError, fail } = require('../utils/response');
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

const AIConversation = () => mongoose.model('AIConversation');
const AIContext      = () => mongoose.model('AIContext');
const AISuggestion   = () => mongoose.model('AISuggestion');
const AIAction       = () => mongoose.model('AIAction');
const AITask         = () => mongoose.model('AITask');

// ── NLQ intent detection ──────────────────────────────────────────────────────
function detectIntent(q) {
  const t = q.toLowerCase();
  if (t.match(/today.?s sales|revenue today|orders today|daily sales/)) return 'daily_sales';
  if (t.match(/overdue|unpaid invoice|outstanding invoice/))            return 'overdue_invoices';
  if (t.match(/replenish|low stock|stock shortage|reorder/))            return 'inventory_replenishment';
  if (t.match(/delayed project|project delay|overdue project/))         return 'delayed_projects';
  if (t.match(/maintenance|machine breakdown|machine.*down/))           return 'maintenance_status';
  if (t.match(/production|manufacturing|work order|production order/))  return 'production_status';
  if (t.match(/cash flow|treasury|bank balance/))                       return 'cash_flow';
  if (t.match(/pending approval|awaiting approval|approvals/))          return 'pending_approvals';
  if (t.match(/employee.*leave|on leave|leave today|absent/))           return 'employees_on_leave';
  if (t.match(/inventory shortage|out of stock|no stock/))              return 'inventory_shortage';
  if (t.match(/executive summary|briefing|daily brief/))                return 'executive_summary';
  if (t.match(/anomaly|alert|unusual|spike|drop/))                      return 'anomalies';
  if (t.match(/recommend|suggestion|what should i/))                    return 'recommendations';
  if (t.match(/forecast|prediction|predict/))                           return 'forecasts';
  if (t.match(/employee|staff|headcount|workforce/))                    return 'workforce';
  if (t.match(/vendor|supplier|purchase order|po/))                     return 'purchase_orders';
  if (t.match(/invoice|bill|payable/))                                  return 'payables';
  if (t.match(/project|milestone|task/))                                return 'projects';
  if (t.match(/asset|equipment|eam/))                                   return 'assets';
  if (t.match(/quality|defect|qc/))                                     return 'quality';
  return 'general';
}

// ── Intent handlers ───────────────────────────────────────────────────────────
async function resolveIntent(intent, _query) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (intent) {
    case 'daily_sales': {
      const [orders, revenue] = await Promise.all([
        safeCount('Order', { createdAt: { $gte: today } }),
        safeAgg('Order', [{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      ]);
      const total = revenue[0]?.total || 0;
      return { intent, data: { orders, revenue: total }, message: `Today: ${orders} orders, ₹${total.toLocaleString()} revenue.` };
    }
    case 'overdue_invoices': {
      const invoices = await safeAgg('CustomerInvoice', [
        { $match: { status: 'overdue' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]);
      const d = invoices[0] || { count: 0, total: 0 };
      return { intent, data: d, message: `${d.count} overdue invoices totalling ₹${d.total.toLocaleString()}.` };
    }
    case 'inventory_replenishment':
    case 'inventory_shortage': {
      const [lowStock, outOfStock] = await Promise.all([
        safeCount('Inventory', { quantity: { $lte: 10, $gt: 0 } }),
        safeCount('Inventory', { quantity: 0 }),
      ]);
      return { intent, data: { lowStock, outOfStock }, message: `${outOfStock} SKUs out of stock, ${lowStock} with low inventory.` };
    }
    case 'delayed_projects': {
      const [delayed, atRisk] = await Promise.all([
        safeCount('Project', { status: 'delayed' }),
        safeCount('Project', { status: 'at_risk' }),
      ]);
      return { intent, data: { delayed, atRisk }, message: `${delayed} delayed projects, ${atRisk} at risk.` };
    }
    case 'maintenance_status': {
      const [breakdowns, openWO] = await Promise.all([
        safeCount('Machine', { status: 'breakdown' }),
        safeCount('MaintenanceWorkOrder', { status: { $in: ['open','in_progress'] } }),
      ]);
      return { intent, data: { breakdowns, openWO }, message: `${breakdowns} machines in breakdown. ${openWO} open maintenance work orders.` };
    }
    case 'production_status': {
      const stats = await safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const byStatus = {};
      stats.forEach(s => { byStatus[s._id] = s.count; });
      const inProgress = byStatus['in_progress'] || 0;
      const delayed    = byStatus['delayed']      || 0;
      return { intent, data: byStatus, message: `${inProgress} orders in progress, ${delayed} delayed.` };
    }
    case 'cash_flow': {
      const [ar, ap] = await Promise.all([
        safeAgg('CustomerInvoice', [{ $match: { status: { $in: ['sent','overdue'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        safeAgg('VendorInvoice',   [{ $match: { status: { $in: ['pending','approved'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      ]);
      const receivable = ar[0]?.total || 0;
      const payable    = ap[0]?.total || 0;
      const net        = receivable - payable;
      return { intent, data: { receivable, payable, net }, message: `AR: ₹${receivable.toLocaleString()}, AP: ₹${payable.toLocaleString()}, Net: ₹${net.toLocaleString()}.` };
    }
    case 'pending_approvals': {
      const [leaves, wf, po] = await Promise.all([
        safeCount('LeaveRequest', { status: 'pending' }),
        safeCount('WorkflowInstance', { status: 'pending' }),
        safeCount('PurchaseOrder', { status: 'pending_approval' }),
      ]);
      return { intent, data: { leaves, workflows: wf, purchaseOrders: po }, message: `${leaves} leave requests, ${wf} workflows, ${po} POs pending approval.` };
    }
    case 'employees_on_leave': {
      const onLeave = await safeCount('LeaveRequest', { status: 'approved', startDate: { $lte: now }, endDate: { $gte: now } });
      return { intent, data: { onLeave }, message: `${onLeave} employee(s) currently on approved leave.` };
    }
    case 'anomalies': {
      const [critical, high, total] = await Promise.all([
        safeCount('AnomalyDetection', { isResolved: false, severity: 'critical' }),
        safeCount('AnomalyDetection', { isResolved: false, severity: 'high' }),
        safeCount('AnomalyDetection', { isResolved: false }),
      ]);
      return { intent, data: { critical, high, total }, message: `${total} open anomalies: ${critical} critical, ${high} high severity.` };
    }
    case 'recommendations': {
      const pending = await safeCount('AIRecommendation', { status: 'pending' });
      return { intent, data: { pending }, message: `${pending} AI recommendation(s) pending review.` };
    }
    case 'forecasts': {
      const latest = await safeAgg('AIForecast', [
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: { forecastType: 1, confidence: 1, status: 1, createdAt: 1 } },
      ]);
      return { intent, data: { recent: latest }, message: `${latest.length} recent forecast(s) found.` };
    }
    case 'workforce': {
      const [total, active] = await Promise.all([
        safeCount('Employee', {}),
        safeCount('Employee', { isActive: true }),
      ]);
      return { intent, data: { total, active }, message: `${active} active employees (${total} total).` };
    }
    case 'purchase_orders': {
      const stats = await safeAgg('PurchaseOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const byStatus = {};
      stats.forEach(s => { byStatus[s._id] = s.count; });
      return { intent, data: byStatus, message: `Purchase orders: ${JSON.stringify(byStatus)}.` };
    }
    case 'projects': {
      const stats = await safeAgg('Project', [{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const byStatus = {};
      stats.forEach(s => { byStatus[s._id] = s.count; });
      return { intent, data: byStatus, message: `Projects by status: ${Object.entries(byStatus).map(([k,v]) => `${k}: ${v}`).join(', ')}.` };
    }
    case 'assets': {
      const [total, active, maintenance] = await Promise.all([
        safeCount('Asset', {}),
        safeCount('Asset', { status: 'active' }),
        safeCount('Asset', { status: 'maintenance' }),
      ]);
      return { intent, data: { total, active, maintenance }, message: `${active}/${total} assets active, ${maintenance} in maintenance.` };
    }
    case 'quality': {
      const recent = await safeCount('QualityCheck', { status: 'failed', createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } });
      return { intent, data: { recentFailures: recent }, message: `${recent} quality check failures in the last 7 days.` };
    }
    case 'executive_summary': {
      const [orders, revenue, anomalies, openIssues, employees] = await Promise.all([
        safeCount('Order', { createdAt: { $gte: today } }),
        safeAgg('Order', [{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        safeCount('AnomalyDetection', { isResolved: false, severity: { $in: ['critical','high'] } }),
        safeCount('Project', { status: { $in: ['delayed','at_risk'] } }),
        safeCount('Employee', { isActive: true }),
      ]);
      const rev = revenue[0]?.total || 0;
      return {
        intent,
        data: { todayOrders: orders, todayRevenue: rev, criticalAnomalies: anomalies, projectsAtRisk: openIssues, employees },
        message: `Executive Summary — Today: ${orders} orders (₹${rev.toLocaleString()}). ${anomalies} critical alerts. ${openIssues} at-risk projects. ${employees} employees active.`,
      };
    }
    default:
      return { intent: 'general', data: {}, message: 'I can help with sales, inventory, invoices, projects, production, employees, cash flow, and more. What would you like to know?' };
  }
}

// ── Send message (core copilot API) ──────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { content, conversationId } = req.body || {};
    if (!content?.trim()) return fail(res, 'Message content required');

    const intent = detectIntent(content);
    const resolved = await resolveIntent(intent, content);

    let conv;
    if (conversationId) {
      conv = await AIConversation().findById(conversationId);
    }
    if (!conv) {
      conv = await AIConversation().create({
        userId: req.user?._id, userType: 'admin',
        title: content.slice(0, 60),
        messages: [],
        lastActivity: new Date(),
      });
    }

    conv.messages.push({ role: 'user', content, timestamp: new Date() });
    conv.messages.push({ role: 'assistant', content: resolved.message, intent, module: resolved.data?.module, data: resolved.data, timestamp: new Date() });
    conv.lastActivity = new Date();
    await conv.save();

    await AIContext().create({
      conversationId: conv._id, userId: req.user?._id,
      intent, module: resolved.data?.module,
      entities: resolved.data,
      confidence: 85,
    });

    emit(req.app?.locals?.io, 'ai:assistant_reply', {
      conversationId: conv._id, intent, message: resolved.message,
    });

    ok(res, { conversationId: conv._id, intent, message: resolved.message, data: resolved.data });
  } catch (e) { serverError(res, e); }
};

// ── Conversations CRUD ────────────────────────────────────────────────────────
exports.listConversations = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { status: { $ne: 'deleted' } };
    if (req.user?._id) filter.userId = req.user._id;
    const [data, total] = await Promise.all([
      AIConversation().find(filter).sort({ lastActivity: -1 }).skip(skip).limit(Number(limit)).lean(),
      AIConversation().countDocuments(filter),
    ]);
    ok(res, { data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { serverError(res, e); }
};

exports.getConversation = async (req, res) => {
  try {
    const c = await AIConversation().findById(req.params.id).lean();
    if (!c) return notFound(res, 'Conversation not found');
    ok(res, c);
  } catch (e) { serverError(res, e); }
};

exports.createConversation = async (req, res) => {
  try {
    const { title } = req.body || {};
    const c = await AIConversation().create({ userId: req.user?._id, title: title || 'New Conversation' });
    created(res, c);
  } catch (e) { serverError(res, e); }
};

exports.deleteConversation = async (req, res) => {
  try {
    await AIConversation().findByIdAndUpdate(req.params.id, { status: 'deleted' });
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

// ── Smart Suggestions ─────────────────────────────────────────────────────────
exports.getSuggestions = async (req, res) => {
  try {
    const { status = 'pending', limit = 10 } = req.query;
    const data = await AISuggestion().find({ status }).sort({ priority: 1, createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};

exports.generateSuggestions = async (req, res) => {
  try {
    const [lowStock, machineDown, overdueAR, delayedProjects, pendingLeaves] = await Promise.all([
      safeCount('Inventory', { quantity: { $lte: 10, $gt: 0 } }),
      safeCount('Machine', { status: 'breakdown' }),
      safeAgg('CustomerInvoice', [{ $match: { status: 'overdue' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      safeCount('Project', { status: 'delayed' }),
      safeCount('LeaveRequest', { status: 'pending' }),
    ]);

    const suggestions = [];
    const ar = overdueAR[0] || { total: 0 };

    if (lowStock > 5) {
      const s = await AISuggestion().create({
        type: 'replenishment', title: `Replenish ${lowStock} Low-Stock SKUs`,
        description: `${lowStock} products are below minimum stock. Create purchase orders to prevent stockouts.`,
        priority: lowStock > 20 ? 'critical' : 'high', confidence: 88, module: 'inventory',
        actionData: { lowStockCount: lowStock, suggestedAction: 'create_purchase_orders' },
      });
      suggestions.push(s);
    }
    if (machineDown > 0) {
      const s = await AISuggestion().create({
        type: 'maintenance_schedule', title: `Schedule Repair for ${machineDown} Machine(s)`,
        description: `${machineDown} machine(s) are in breakdown. Schedule emergency maintenance immediately.`,
        priority: 'critical', confidence: 95, module: 'manufacturing',
        actionData: { machinesDown: machineDown, suggestedAction: 'create_maintenance_workorder' },
      });
      suggestions.push(s);
    }
    if (ar.total > 100000) {
      const s = await AISuggestion().create({
        type: 'customer_followup', title: 'Follow Up on Overdue Invoices',
        description: `₹${ar.total.toLocaleString()} in overdue AR. Send reminders to customers immediately.`,
        priority: ar.total > 500000 ? 'critical' : 'high', confidence: 85, module: 'finance',
        actionData: { overdueTotal: ar.total, suggestedAction: 'send_payment_reminders' },
      });
      suggestions.push(s);
    }
    if (delayedProjects > 0) {
      const s = await AISuggestion().create({
        type: 'project_risk', title: `Review ${delayedProjects} Delayed Project(s)`,
        description: `${delayedProjects} project(s) are delayed. Review scope, resources, and timeline.`,
        priority: 'high', confidence: 80, module: 'projects',
        actionData: { delayedCount: delayedProjects, suggestedAction: 'project_review_meeting' },
      });
      suggestions.push(s);
    }
    if (pendingLeaves > 15) {
      const s = await AISuggestion().create({
        type: 'hr_reminder', title: `Process ${pendingLeaves} Pending Leave Requests`,
        description: `${pendingLeaves} leave requests awaiting approval. Delayed approvals impact employee morale.`,
        priority: 'medium', confidence: 90, module: 'hrms',
        actionData: { pendingCount: pendingLeaves, suggestedAction: 'process_leave_requests' },
      });
      suggestions.push(s);
    }

    ok(res, { generated: suggestions.length, suggestions });
  } catch (e) { serverError(res, e); }
};

exports.applySuggestion = async (req, res) => {
  try {
    const s = await AISuggestion().findByIdAndUpdate(
      req.params.id,
      { status: 'applied', appliedAt: new Date(), appliedBy: req.user?._id },
      { new: true }
    );
    if (!s) return notFound(res, 'Suggestion not found');

    const action = await AIAction().create({
      type: 'custom', title: `Applied: ${s.title}`, module: s.module,
      status: 'completed', triggeredBy: 'user', executedBy: req.user?._id,
      suggestionId: s._id, executedAt: new Date(),
      result: { suggestion: s.title, module: s.module },
    });

    emit(req.app?.locals?.io, 'ai:task_completed', { type: 'suggestion_applied', suggestionId: s._id });
    ok(res, { suggestion: s, action });
  } catch (e) { serverError(res, e); }
};

exports.dismissSuggestion = async (req, res) => {
  try {
    const s = await AISuggestion().findByIdAndUpdate(req.params.id, { status: 'dismissed' }, { new: true });
    if (!s) return notFound(res, 'Suggestion not found');
    ok(res, s);
  } catch (e) { serverError(res, e); }
};

// ── Tasks ──────────────────────────────────────────────────────────────────────
exports.createTask = async (req, res) => {
  try {
    const { type, title, input, priority } = req.body || {};
    const t = await AITask().create({ type, title, input, priority, userId: req.user?._id, status: 'pending' });
    emit(req.app?.locals?.io, 'ai:task_completed', { taskId: t._id, type, status: 'pending' });
    created(res, t);
  } catch (e) { serverError(res, e); }
};

exports.listTasks = async (req, res) => {
  try {
    const { status, type, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    const data = await AITask().find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};

exports.getTask = async (req, res) => {
  try {
    const t = await AITask().findById(req.params.id).lean();
    if (!t) return notFound(res, 'Task not found');
    ok(res, t);
  } catch (e) { serverError(res, e); }
};

exports.listActions = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const data = await AIAction().find({}).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};
