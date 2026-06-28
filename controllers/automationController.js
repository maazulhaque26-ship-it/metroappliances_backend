const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

const AutomationRule      = () => mongoose.model('AutomationRule');
const AutomationExecution = () => mongoose.model('AutomationExecution');
const AutomationHistory   = () => mongoose.model('AutomationHistory');
const AutomationTemplate  = () => mongoose.model('AutomationTemplate');
const AIAction            = () => mongoose.model('AIAction');

const tryM = (name) => { try { return mongoose.model(name); } catch { return null; } };
const safeCount = async (model, filter = {}) => {
  const M = tryM(model); if (!M) return 0;
  try { return await M.countDocuments(filter); } catch { return 0; }
};

// ── Rules CRUD ─────────────────────────────────────────────────────────────────
exports.listRules = async (req, res) => {
  try {
    const { trigger, category, isActive, limit = 30, page = 1 } = req.query;
    const filter = {};
    if (trigger)  filter.trigger  = trigger;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AutomationRule().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      AutomationRule().countDocuments(filter),
    ]);
    ok(res, { data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { serverError(res, e); }
};

exports.getRule = async (req, res) => {
  try {
    const r = await AutomationRule().findById(req.params.id).lean();
    if (!r) return notFound(res, 'Rule not found');
    ok(res, r);
  } catch (e) { serverError(res, e); }
};

exports.createRule = async (req, res) => {
  try {
    const r = await AutomationRule().create({ ...req.body, createdBy: req.user?._id });
    await AutomationHistory().create({
      ruleId: r._id, event: 'rule_created',
      details: { name: r.name, trigger: r.trigger }, performedBy: req.user?._id,
    });
    created(res, r);
  } catch (e) { serverError(res, e); }
};

exports.updateRule = async (req, res) => {
  try {
    const r = await AutomationRule().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!r) return notFound(res, 'Rule not found');
    await AutomationHistory().create({
      ruleId: r._id, event: 'rule_updated',
      details: { updatedFields: Object.keys(req.body) }, performedBy: req.user?._id,
    });
    ok(res, r);
  } catch (e) { serverError(res, e); }
};

exports.deleteRule = async (req, res) => {
  try {
    const r = await AutomationRule().findById(req.params.id);
    if (!r) return notFound(res, 'Rule not found');
    await AutomationHistory().create({ ruleId: r._id, event: 'rule_deleted', details: { name: r.name }, performedBy: req.user?._id });
    await AutomationRule().findByIdAndDelete(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.toggleRule = async (req, res) => {
  try {
    const r = await AutomationRule().findById(req.params.id);
    if (!r) return notFound(res, 'Rule not found');
    r.isActive = !r.isActive;
    await r.save();
    const event = r.isActive ? 'rule_activated' : 'rule_deactivated';
    await AutomationHistory().create({ ruleId: r._id, event, performedBy: req.user?._id });
    ok(res, r);
  } catch (e) { serverError(res, e); }
};

// ── Execute Rule ───────────────────────────────────────────────────────────────
async function runRuleActions(rule, exec, userId, io) {
  const actions = rule.actions || [];
  let completed = 0;
  let failed    = 0;

  for (const step of actions) {
    try {
      const action = await AIAction().create({
        type: step.type || 'custom', title: `${rule.name} — step ${step.order || 0}`,
        module: rule.module, status: 'completed', triggeredBy: 'automation',
        executedBy: userId, ruleId: rule._id,
        input: step.config, executedAt: new Date(),
        result: { step: step.type, ruleId: rule._id, config: step.config },
      });
      completed++;
      emit(io, 'ai:automation_triggered', { ruleId: rule._id, execId: exec._id, step: step.type, actionId: action._id });
    } catch {
      failed++;
      if (step.onFailure === 'stop') break;
    }
  }

  return { completed, failed };
}

exports.executeRule = async (req, res) => {
  try {
    const rule = await AutomationRule().findById(req.params.id);
    if (!rule) return notFound(res, 'Rule not found');

    const exec = await AutomationExecution().create({
      ruleId: rule._id, trigger: 'manual', status: 'running',
      startedAt: new Date(), triggeredBy: req.user?._id,
    });

    await AutomationHistory().create({ ruleId: rule._id, executionId: exec._id, event: 'execution_started', performedBy: req.user?._id });

    const { completed, failed } = await runRuleActions(rule, exec, req.user?._id, req.app?.locals?.io);
    const start = exec.startedAt;
    const end   = new Date();
    const status = failed > 0 && completed === 0 ? 'failed' : 'completed';

    exec.status           = status;
    exec.completedAt      = end;
    exec.duration         = end - start;
    exec.actionsCompleted = completed;
    exec.actionsFailed    = failed;
    await exec.save();

    await AutomationRule().findByIdAndUpdate(rule._id, {
      $inc: { runCount: 1, successCount: status === 'completed' ? 1 : 0, failureCount: status === 'failed' ? 1 : 0 },
      lastRunAt: end,
    });

    const histEvent = status === 'completed' ? 'execution_completed' : 'execution_failed';
    await AutomationHistory().create({ ruleId: rule._id, executionId: exec._id, event: histEvent, details: { completed, failed }, performedBy: req.user?._id });

    ok(res, { execution: exec, actionsCompleted: completed, actionsFailed: failed });
  } catch (e) { serverError(res, e); }
};

exports.testRule = async (req, res) => {
  try {
    const rule = await AutomationRule().findById(req.params.id);
    if (!rule) return notFound(res, 'Rule not found');
    const wouldRun = (rule.actions || []).length;
    ok(res, { valid: true, actionsCount: wouldRun, conditions: rule.conditions, trigger: rule.trigger, message: `Rule "${rule.name}" would execute ${wouldRun} action(s)` });
  } catch (e) { serverError(res, e); }
};

// ── Executions ────────────────────────────────────────────────────────────────
exports.listExecutions = async (req, res) => {
  try {
    const { ruleId, status, limit = 30, page = 1 } = req.query;
    const filter = {};
    if (ruleId) filter.ruleId = ruleId;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AutomationExecution().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('ruleId', 'name category').lean(),
      AutomationExecution().countDocuments(filter),
    ]);
    ok(res, { data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { serverError(res, e); }
};

exports.getExecution = async (req, res) => {
  try {
    const e = await AutomationExecution().findById(req.params.id).populate('ruleId', 'name category trigger').lean();
    if (!e) return notFound(res, 'Execution not found');
    ok(res, e);
  } catch (e) { serverError(res, e); }
};

// ── History ────────────────────────────────────────────────────────────────────
exports.listHistory = async (req, res) => {
  try {
    const { ruleId, event, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (ruleId) filter.ruleId = ruleId;
    if (event)  filter.event  = event;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AutomationHistory().find(filter).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)).lean(),
      AutomationHistory().countDocuments(filter),
    ]);
    ok(res, { data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { serverError(res, e); }
};

// ── Templates ─────────────────────────────────────────────────────────────────
exports.listTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const data = await AutomationTemplate().find(filter).sort({ isBuiltIn: -1, useCount: -1 }).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};

exports.createFromTemplate = async (req, res) => {
  try {
    const tmpl = await AutomationTemplate().findById(req.params.id);
    if (!tmpl) return notFound(res, 'Template not found');
    const { name, schedule } = req.body || {};
    const rule = await AutomationRule().create({
      name:       name || `${tmpl.name} — ${new Date().toLocaleDateString()}`,
      description: tmpl.description,
      trigger:    tmpl.trigger,
      category:   tmpl.category,
      schedule:   schedule || tmpl.defaultSchedule,
      conditions: tmpl.conditionTemplate,
      actions:    tmpl.actionTemplate || [],
      templateId: tmpl._id,
      createdBy:  req.user?._id,
    });
    await AutomationTemplate().findByIdAndUpdate(tmpl._id, { $inc: { useCount: 1 } });
    await AutomationHistory().create({ ruleId: rule._id, event: 'rule_created', details: { fromTemplate: tmpl.name }, performedBy: req.user?._id });
    created(res, rule);
  } catch (e) { serverError(res, e); }
};

exports.seedBuiltInTemplates = async (req, res) => {
  try {
    const templates = [
      { name: 'Daily Low Stock Alert', description: 'Notify when SKUs fall below minimum stock', category: 'replenishment', trigger: 'schedule', defaultSchedule: '0 8 * * *', isBuiltIn: true, actionTemplate: [{ type: 'notify', config: { channel: 'email', template: 'low_stock_alert' }, order: 1, onFailure: 'continue' }] },
      { name: 'Overdue Invoice Reminder', description: 'Send payment reminders for overdue invoices', category: 'reminder', trigger: 'schedule', defaultSchedule: '0 9 * * 1', isBuiltIn: true, actionTemplate: [{ type: 'send_reminder', config: { type: 'payment', days_overdue: 7 }, order: 1, onFailure: 'continue' }] },
      { name: 'Machine Breakdown Escalation', description: 'Escalate when machine is in breakdown > 4hrs', category: 'escalation', trigger: 'event', eventType: 'machine.breakdown', isBuiltIn: true, actionTemplate: [{ type: 'escalate', config: { to: 'maintenance_manager', priority: 'critical' }, order: 1, onFailure: 'continue' }, { type: 'create_alert', config: { severity: 'critical' }, order: 2, onFailure: 'continue' }] },
      { name: 'Project Delay Notification', description: 'Alert PM when project goes to delayed status', category: 'notification', trigger: 'event', eventType: 'project.delayed', isBuiltIn: true, actionTemplate: [{ type: 'notify', config: { role: 'project_manager', template: 'project_delay' }, order: 1, onFailure: 'continue' }] },
      { name: 'Weekly KPI Report', description: 'Generate and distribute weekly KPI digest', category: 'reporting', trigger: 'schedule', defaultSchedule: '0 7 * * 1', isBuiltIn: true, actionTemplate: [{ type: 'export', config: { report: 'kpi_digest', format: 'pdf', recipients: ['executives'] }, order: 1, onFailure: 'stop' }] },
      { name: 'Leave Approval Reminder', description: 'Remind managers of pending leave approvals daily', category: 'reminder', trigger: 'schedule', defaultSchedule: '0 10 * * *', isBuiltIn: true, actionTemplate: [{ type: 'send_reminder', config: { type: 'leave_approval', threshold: 5 }, order: 1, onFailure: 'continue' }] },
    ];
    const seeded = [];
    for (const t of templates) {
      const exists = await AutomationTemplate().findOne({ name: t.name });
      if (!exists) seeded.push(await AutomationTemplate().create(t));
    }
    ok(res, { seeded: seeded.length });
  } catch (e) { serverError(res, e); }
};

// ── Stats ─────────────────────────────────────────────────────────────────────
exports.getAutomationStats = async (req, res) => {
  try {
    const [totalRules, activeRules, totalExec, recentExec, byCategory] = await Promise.all([
      AutomationRule().countDocuments({}),
      AutomationRule().countDocuments({ isActive: true }),
      AutomationExecution().countDocuments({}),
      AutomationExecution().countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      AutomationRule().aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, activeCount: { $sum: { $cond: ['$isActive', 1, 0] } } } }]),
    ]);
    ok(res, { totalRules, activeRules, totalExecutions: totalExec, recentExecutions: recentExec, byCategory });
  } catch (e) { serverError(res, e); }
};
