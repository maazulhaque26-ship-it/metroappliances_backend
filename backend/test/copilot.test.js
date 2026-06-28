const mongoose = require('mongoose');
require('../models/AIAssistant');
require('../models/AIConversation');
require('../models/AIContext');
require('../models/AIPrompt');
require('../models/AITask');
require('../models/AISuggestion');
require('../models/AIAction');
require('../models/AIInsight');
require('../models/AIKnowledge');
require('../models/AIFeedback');
require('../models/AutomationRule');
require('../models/AutomationExecution');
require('../models/AutomationHistory');
require('../models/AutomationTemplate');

const M = (name) => mongoose.model(name);
const AIAssistant      = () => M('AIAssistant');
const AIConversation   = () => M('AIConversation');
const AIContext        = () => M('AIContext');
const AIPrompt         = () => M('AIPrompt');
const AITask           = () => M('AITask');
const AISuggestion     = () => M('AISuggestion');
const AIAction         = () => M('AIAction');
const AIInsight        = () => M('AIInsight');
const AIKnowledge      = () => M('AIKnowledge');
const AIFeedback       = () => M('AIFeedback');
const AutomationRule   = () => M('AutomationRule');
const AutomationExecution = () => M('AutomationExecution');
const AutomationHistory   = () => M('AutomationHistory');
const AutomationTemplate  = () => M('AutomationTemplate');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/metroappliances_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ─── AIAssistant ──────────────────────────────────────────────────────────────
describe('AIAssistant model', () => {
  let ast;
  it('creates assistant with auto assistantCode', async () => {
    ast = await AIAssistant().create({ name: 'ERP Copilot', type: 'erp', description: 'General ERP assistant', capabilities: ['query','suggest'] });
    expect(ast.assistantCode).toMatch(/^AST-\d{4}-\d{5}$/);
    expect(ast.isActive).toBe(true);
    expect(ast.isDefault).toBe(false);
  });
  it('creates default assistant', async () => {
    const a = await AIAssistant().create({ name: 'Finance Asst', type: 'finance', description: 'Finance', isDefault: true });
    expect(a.type).toBe('finance');
    expect(a.isDefault).toBe(true);
  });
  it('rejects invalid type', async () => {
    await expect(AIAssistant().create({ name: 'Bad', type: 'robot', description: 'x' })).rejects.toThrow();
  });
  it('lists active assistants', async () => {
    const list = await AIAssistant().find({ isActive: true }).lean();
    expect(list.length).toBeGreaterThan(0);
  });
});

// ─── AIConversation ───────────────────────────────────────────────────────────
describe('AIConversation model', () => {
  let conv;
  it('creates conversation with auto convCode', async () => {
    conv = await AIConversation().create({ title: 'Test Chat', userType: 'admin' });
    expect(conv.convCode).toMatch(/^CNV-\d{4}-\d{5}$/);
    expect(conv.status).toBe('active');
    expect(conv.messages).toEqual([]);
  });
  it('pushes messages into conversation', async () => {
    conv.messages.push({ role: 'user', content: 'Show sales', timestamp: new Date() });
    conv.messages.push({ role: 'assistant', content: 'Today sales: ₹2.4L', intent: 'sales_query', timestamp: new Date() });
    await conv.save();
    const reloaded = await AIConversation().findById(conv._id).lean();
    expect(reloaded.messages).toHaveLength(2);
    expect(reloaded.messages[0].role).toBe('user');
    expect(reloaded.messages[1].intent).toBe('sales_query');
  });
  it('rejects invalid userType', async () => {
    await expect(AIConversation().create({ title: 'X', userType: 'robot' })).rejects.toThrow();
  });
});

// ─── AIContext ────────────────────────────────────────────────────────────────
describe('AIContext model', () => {
  it('creates context with auto contextCode', async () => {
    const conv = await AIConversation().create({ title: 'CTX Chat', userType: 'admin' });
    const ctx = await AIContext().create({ conversationId: conv._id, intent: 'inventory_query', confidence: 0.92, entities: { product: 'Refrigerator' }, isActive: true });
    expect(ctx.contextCode).toMatch(/^CTX-\d{4}-\d{5}$/);
    expect(ctx.confidence).toBe(0.92);
    expect(ctx.isActive).toBe(true);
  });
  it('stores arbitrary entities as Mixed', async () => {
    const conv = await AIConversation().create({ title: 'E Chat', userType: 'admin' });
    const ctx = await AIContext().create({ conversationId: conv._id, intent: 'finance_query', entities: { invoiceId: 'INV-001', amount: 5000, currency: 'INR' } });
    expect(ctx.entities.currency).toBe('INR');
  });
});

// ─── AIPrompt ────────────────────────────────────────────────────────────────
describe('AIPrompt model', () => {
  let prompt;
  it('creates prompt with auto promptCode', async () => {
    prompt = await AIPrompt().create({ title: 'Daily Sales', category: 'sales', promptText: 'Show today\'s sales summary', isBuiltIn: true });
    expect(prompt.promptCode).toMatch(/^PRM-\d{4}-\d{5}$/);
    expect(prompt.useCount).toBe(0);
    expect(prompt.isBuiltIn).toBe(true);
  });
  it('increments useCount', async () => {
    await AIPrompt().findByIdAndUpdate(prompt._id, { $inc: { useCount: 1 } });
    const p = await AIPrompt().findById(prompt._id).lean();
    expect(p.useCount).toBe(1);
  });
  it('rejects invalid category', async () => {
    await expect(AIPrompt().create({ title: 'Bad', category: 'unknown', promptText: 'x' })).rejects.toThrow();
  });
  it('creates prompt in each valid category', async () => {
    const cats = ['finance','inventory','production','hr','maintenance','projects','general','executive'];
    for (const cat of cats) {
      const p = await AIPrompt().create({ title: `${cat} prompt`, category: cat, promptText: `Show ${cat}` });
      expect(p.category).toBe(cat);
    }
  });
});

// ─── AITask ───────────────────────────────────────────────────────────────────
describe('AITask model', () => {
  it('creates task with auto taskCode', async () => {
    const t = await AITask().create({ type: 'query', title: 'Sales Query', status: 'pending' });
    expect(t.taskCode).toMatch(/^TSK-\d{4}-\d{5}$/);
    expect(t.progress).toBe(0);
    expect(t.status).toBe('pending');
  });
  it('updates progress and status', async () => {
    const t = await AITask().create({ type: 'report', title: 'Sales Report', status: 'pending' });
    await AITask().findByIdAndUpdate(t._id, { status: 'running', progress: 50 });
    const updated = await AITask().findById(t._id).lean();
    expect(updated.status).toBe('running');
    expect(updated.progress).toBe(50);
  });
  it('rejects invalid task type', async () => {
    await expect(AITask().create({ type: 'invalid', title: 'X' })).rejects.toThrow();
  });
  it('rejects invalid status', async () => {
    await expect(AITask().create({ type: 'query', title: 'Y', status: 'unknown' })).rejects.toThrow();
  });
});

// ─── AISuggestion ─────────────────────────────────────────────────────────────
describe('AISuggestion model', () => {
  it('creates suggestion with auto suggestionCode', async () => {
    const s = await AISuggestion().create({ type: 'replenishment', title: 'Restock Fridge', description: 'Low stock', priority: 'high', source: 'copilot' });
    expect(s.suggestionCode).toMatch(/^SGG-\d{4}-\d{5}$/);
    expect(s.status).toBe('pending');
  });
  it('creates suggestion for each valid type', async () => {
    const types = ['purchase','production_plan','budget_alert','project_risk','maintenance_schedule','customer_followup','vendor_reminder','hr_reminder','finance_alert'];
    for (const t of types) {
      const s = await AISuggestion().create({ type: t, title: `Suggest ${t}`, description: 'd', priority: 'medium', source: 'forecast' });
      expect(s.type).toBe(t);
    }
  });
  it('marks suggestion applied', async () => {
    const s = await AISuggestion().create({ type: 'purchase', title: 'Apply Test', description: 'd', priority: 'low', source: 'manual' });
    await AISuggestion().findByIdAndUpdate(s._id, { status: 'applied', appliedAt: new Date() });
    const upd = await AISuggestion().findById(s._id).lean();
    expect(upd.status).toBe('applied');
    expect(upd.appliedAt).toBeTruthy();
  });
});

// ─── AIAction ────────────────────────────────────────────────────────────────
describe('AIAction model', () => {
  it('creates action with auto actionCode', async () => {
    const a = await AIAction().create({ type: 'notify', title: 'Notify Mgr', module: 'hr', triggeredBy: 'user', status: 'pending' });
    expect(a.actionCode).toMatch(/^ACT-\d{4}-\d{5}$/);
    expect(a.status).toBe('pending');
  });
  it('creates action for each valid type', async () => {
    const types = ['create_po','replenish_stock','schedule_maintenance','send_reminder','create_alert','escalate','approve','export','custom'];
    for (const t of types) {
      const a = await AIAction().create({ type: t, title: `Action ${t}`, module: 'general', triggeredBy: 'automation', status: 'completed' });
      expect(a.type).toBe(t);
    }
  });
  it('rejects invalid triggeredBy', async () => {
    await expect(AIAction().create({ type: 'notify', title: 'X', module: 'x', triggeredBy: 'robot' })).rejects.toThrow();
  });
});

// ─── AIInsight ───────────────────────────────────────────────────────────────
describe('AIInsight model', () => {
  it('creates insight with auto insightCode', async () => {
    const i = await AIInsight().create({ type: 'daily_briefing', title: 'Morning Briefing', content: 'Today looks good.', highlights: ['Sales up 5%', 'No anomalies'] });
    expect(i.insightCode).toMatch(/^INS-\d{4}-\d{5}$/);
    expect(i.isRead).toBe(false);
  });
  it('marks insight as read', async () => {
    const i = await AIInsight().create({ type: 'kpi_digest', title: 'KPI Digest', content: 'KPIs in range.' });
    await AIInsight().findByIdAndUpdate(i._id, { isRead: true });
    const upd = await AIInsight().findById(i._id).lean();
    expect(upd.isRead).toBe(true);
  });
  it('creates all valid insight types', async () => {
    const types = ['dept_summary','monthly_summary','risk_summary','opportunity_summary','anomaly_report','custom'];
    for (const t of types) {
      const ins = await AIInsight().create({ type: t, title: `Insight ${t}`, content: 'Content here.' });
      expect(ins.type).toBe(t);
    }
  });
});

// ─── AIKnowledge ─────────────────────────────────────────────────────────────
describe('AIKnowledge model', () => {
  it('creates knowledge entry with auto knowledgeCode', async () => {
    const k = await AIKnowledge().create({ category: 'faq', question: 'How to create PO?', answer: 'Go to Procurement > PO > New', keywords: ['PO','procurement'], isVerified: true, module: 'procurement' });
    expect(k.knowledgeCode).toMatch(/^KNW-\d{4}-\d{5}$/);
    expect(k.useCount).toBe(0);
    expect(k.isVerified).toBe(true);
  });
  it('creates entries for all valid categories', async () => {
    const cats = ['process','policy','metric','formula','troubleshoot','how_to','general'];
    for (const cat of cats) {
      const k = await AIKnowledge().create({ category: cat, question: `Q for ${cat}?`, answer: `A for ${cat}.` });
      expect(k.category).toBe(cat);
    }
  });
  it('increments useCount', async () => {
    const k = await AIKnowledge().create({ category: 'faq', question: 'Usage test?', answer: 'Yes.' });
    await AIKnowledge().findByIdAndUpdate(k._id, { $inc: { useCount: 3 } });
    const upd = await AIKnowledge().findById(k._id).lean();
    expect(upd.useCount).toBe(3);
  });
});

// ─── AIFeedback ──────────────────────────────────────────────────────────────
describe('AIFeedback model', () => {
  it('creates feedback with auto feedbackCode', async () => {
    const f = await AIFeedback().create({ rating: 5, thumbs: 'up', category: 'accuracy', comment: 'Very accurate' });
    expect(f.feedbackCode).toMatch(/^FBK-\d{4}-\d{5}$/);
    expect(f.rating).toBe(5);
    expect(f.thumbs).toBe('up');
  });
  it('creates feedback with thumbs down', async () => {
    const f = await AIFeedback().create({ rating: 2, thumbs: 'down', category: 'helpfulness' });
    expect(f.thumbs).toBe('down');
    expect(f.rating).toBe(2);
  });
  it('rejects rating out of range', async () => {
    await expect(AIFeedback().create({ rating: 6, thumbs: 'up', category: 'accuracy' })).rejects.toThrow();
  });
  it('rejects rating below 1', async () => {
    await expect(AIFeedback().create({ rating: 0, thumbs: 'up', category: 'accuracy' })).rejects.toThrow();
  });
  it('accepts all valid categories', async () => {
    const cats = ['speed','relevance','other'];
    for (const cat of cats) {
      const f = await AIFeedback().create({ rating: 4, thumbs: 'up', category: cat });
      expect(f.category).toBe(cat);
    }
  });
});

// ─── AutomationRule ──────────────────────────────────────────────────────────
describe('AutomationRule model', () => {
  let rule;
  it('creates rule with auto ruleCode', async () => {
    rule = await AutomationRule().create({ name: 'Low Stock Alert', trigger: 'schedule', category: 'replenishment', schedule: '0 8 * * *', actions: [{ type: 'notify', config: { channel: 'email' }, order: 1, onFailure: 'continue' }] });
    expect(rule.ruleCode).toMatch(/^AUR-\d{4}-\d{5}$/);
    expect(rule.isActive).toBe(true);
    expect(rule.runCount).toBe(0);
  });
  it('creates rule for each valid trigger', async () => {
    const triggers = ['event','condition','manual','webhook'];
    for (const t of triggers) {
      const r = await AutomationRule().create({ name: `Rule ${t}`, trigger: t, category: 'notification' });
      expect(r.trigger).toBe(t);
    }
  });
  it('toggles isActive', async () => {
    rule.isActive = true;
    await rule.save();
    const upd = await AutomationRule().findById(rule._id).lean();
    expect(upd.isActive).toBe(true);
  });
  it('increments run counts', async () => {
    await AutomationRule().findByIdAndUpdate(rule._id, { $inc: { runCount: 1, successCount: 1 } });
    const upd = await AutomationRule().findById(rule._id).lean();
    expect(upd.runCount).toBe(1);
    expect(upd.successCount).toBe(1);
  });
  it('rejects invalid trigger', async () => {
    await expect(AutomationRule().create({ name: 'Bad', trigger: 'robot', category: 'custom' })).rejects.toThrow();
  });
  it('rejects invalid category', async () => {
    await expect(AutomationRule().create({ name: 'Bad', trigger: 'manual', category: 'unknown' })).rejects.toThrow();
  });
});

// ─── AutomationExecution ─────────────────────────────────────────────────────
describe('AutomationExecution model', () => {
  let rule;
  beforeAll(async () => {
    rule = await AutomationRule().create({ name: 'Exec Test Rule', trigger: 'manual', category: 'custom' });
  });
  it('creates execution with auto execCode', async () => {
    const exec = await AutomationExecution().create({ ruleId: rule._id, trigger: 'manual', status: 'running', startedAt: new Date() });
    expect(exec.execCode).toMatch(/^AEX-\d{4}-\d{5}$/);
    expect(exec.status).toBe('running');
    expect(exec.actionsCompleted).toBe(0);
    expect(exec.actionsFailed).toBe(0);
  });
  it('completes execution with duration', async () => {
    const exec = await AutomationExecution().create({ ruleId: rule._id, trigger: 'schedule', status: 'pending' });
    const start = new Date();
    await AutomationExecution().findByIdAndUpdate(exec._id, { status: 'completed', startedAt: start, completedAt: new Date(), duration: 340, actionsCompleted: 2 });
    const upd = await AutomationExecution().findById(exec._id).lean();
    expect(upd.status).toBe('completed');
    expect(upd.duration).toBe(340);
    expect(upd.actionsCompleted).toBe(2);
  });
  it('rejects invalid status', async () => {
    await expect(AutomationExecution().create({ ruleId: rule._id, trigger: 'manual', status: 'unknown' })).rejects.toThrow();
  });
});

// ─── AutomationHistory ───────────────────────────────────────────────────────
describe('AutomationHistory model', () => {
  let rule;
  beforeAll(async () => {
    rule = await AutomationRule().create({ name: 'History Test Rule', trigger: 'manual', category: 'custom' });
  });
  it('creates history entry with auto automHistCode', async () => {
    const h = await AutomationHistory().create({ ruleId: rule._id, event: 'rule_created', details: { name: rule.name } });
    expect(h.automHistCode).toMatch(/^AHX-\d{4}-\d{5}$/);
    expect(h.event).toBe('rule_created');
  });
  it('creates entries for all valid events', async () => {
    const events = ['rule_updated','rule_activated','rule_deactivated','execution_started','execution_completed','execution_failed','action_completed','action_failed','rule_deleted'];
    for (const ev of events) {
      const h = await AutomationHistory().create({ ruleId: rule._id, event: ev });
      expect(h.event).toBe(ev);
    }
  });
  it('rejects invalid event', async () => {
    await expect(AutomationHistory().create({ ruleId: rule._id, event: 'rule_exploded' })).rejects.toThrow();
  });
});

// ─── AutomationTemplate ──────────────────────────────────────────────────────
describe('AutomationTemplate model', () => {
  it('creates template with auto templateCode', async () => {
    const t = await AutomationTemplate().create({ name: 'Daily Alert Template', description: 'Send daily alert', category: 'reminder', trigger: 'schedule', defaultSchedule: '0 8 * * *', isBuiltIn: true, actionTemplate: [{ type: 'notify', config: { channel: 'email' }, order: 1, onFailure: 'continue' }] });
    expect(t.templateCode).toMatch(/^ATM-\d{4}-\d{5}$/);
    expect(t.isBuiltIn).toBe(true);
    expect(t.useCount).toBe(0);
  });
  it('increments useCount when used', async () => {
    const t = await AutomationTemplate().create({ name: 'Use Count Tmpl', description: 'Test', category: 'custom', trigger: 'manual' });
    await AutomationTemplate().findByIdAndUpdate(t._id, { $inc: { useCount: 2 } });
    const upd = await AutomationTemplate().findById(t._id).lean();
    expect(upd.useCount).toBe(2);
  });
  it('creates templates for all valid categories', async () => {
    const cats = ['approval','notification','escalation','maintenance','reporting'];
    for (const cat of cats) {
      const t = await AutomationTemplate().create({ name: `Template ${cat}`, description: 'd', category: cat, trigger: 'manual' });
      expect(t.category).toBe(cat);
    }
  });
});

// ─── Cross-Model Integration ──────────────────────────────────────────────────
describe('Sprint 16C cross-model integration', () => {
  it('creates a full automation flow: rule -> execution -> history', async () => {
    const rule = await AutomationRule().create({ name: 'Integration Rule', trigger: 'manual', category: 'notification', isActive: true, actions: [{ type: 'notify', config: {}, order: 1, onFailure: 'continue' }] });
    const exec = await AutomationExecution().create({ ruleId: rule._id, trigger: 'manual', status: 'running', startedAt: new Date() });
    const hist = await AutomationHistory().create({ ruleId: rule._id, executionId: exec._id, event: 'execution_started' });

    const action = await AIAction().create({ type: 'notify', title: 'Notify step', module: 'general', triggeredBy: 'automation', status: 'completed' });

    await AutomationExecution().findByIdAndUpdate(exec._id, { status: 'completed', actionsCompleted: 1, completedAt: new Date() });
    await AutomationHistory().create({ ruleId: rule._id, executionId: exec._id, event: 'execution_completed', details: { actionsCompleted: 1 } });

    const [finalExec, histEntries] = await Promise.all([
      AutomationExecution().findById(exec._id).lean(),
      AutomationHistory().find({ ruleId: rule._id }).lean(),
    ]);

    expect(finalExec.status).toBe('completed');
    expect(finalExec.actionsCompleted).toBe(1);
    expect(histEntries.length).toBe(2);
    expect(action.actionCode).toMatch(/^ACT-/);
  });

  it('creates a full copilot conversation flow: assistant -> conversation -> context -> suggestion', async () => {
    const asst = await AIAssistant().create({ name: 'Flow Asst', type: 'general', description: 'Test asst', capabilities: ['query'] });
    const conv = await AIConversation().create({ title: 'Flow Chat', userType: 'admin', assistantId: asst._id });
    conv.messages.push({ role: 'user', content: 'Low stock alert?', timestamp: new Date() });
    conv.messages.push({ role: 'assistant', content: '3 SKUs below reorder', intent: 'inventory_query', timestamp: new Date() });
    await conv.save();

    const ctx = await AIContext().create({ conversationId: conv._id, intent: 'inventory_query', confidence: 0.88, entities: { count: 3 }, isActive: true });
    const sug = await AISuggestion().create({ type: 'replenishment', title: 'Restock SKUs', description: '3 items low', priority: 'high', source: 'copilot', conversationId: conv._id });
    const fb  = await AIFeedback().create({ conversationId: conv._id, rating: 5, thumbs: 'up', category: 'helpfulness' });

    expect(conv.messages).toHaveLength(2);
    expect(ctx.intent).toBe('inventory_query');
    expect(sug.type).toBe('replenishment');
    expect(fb.thumbs).toBe('up');
  });

  it('seeds assistants and prompts independently', async () => {
    const asst1 = await AIAssistant().create({ name: 'Finance Copilot', type: 'finance', description: 'Finance expert', capabilities: ['finance_query'] });
    const prompt1 = await AIPrompt().create({ title: 'Overdue Invoices', category: 'finance', promptText: 'Show overdue invoices', isBuiltIn: true });
    const prompt2 = await AIPrompt().create({ title: 'Cash Position', category: 'finance', promptText: 'What is cash position?', isBuiltIn: true });

    expect(asst1.type).toBe('finance');
    expect(prompt1.isBuiltIn).toBe(true);
    expect(prompt2.isBuiltIn).toBe(true);
  });

  it('creates knowledge base with search keywords', async () => {
    const k1 = await AIKnowledge().create({ category: 'faq', question: 'What is 3-way match?', answer: 'PO + GRN + Invoice comparison', keywords: ['3-way','match','invoice','GRN'], module: 'finance', isVerified: true });
    const k2 = await AIKnowledge().create({ category: 'process', question: 'How to run payroll?', answer: 'Go to Payroll module', keywords: ['payroll','salary','process'], module: 'hr', isVerified: true });

    const results = await AIKnowledge().find({ keywords: /payroll/i, isActive: true }).lean();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].module).toBe('hr');
  });

  it('AI insight is created and marked read', async () => {
    const i = await AIInsight().create({ type: 'daily_briefing', title: 'Morning Briefing', content: 'All systems nominal.', highlights: ['Revenue +3%'], risks: [], opportunities: ['3 leads to follow up'] });
    expect(i.isRead).toBe(false);
    await AIInsight().findByIdAndUpdate(i._id, { isRead: true });
    const upd = await AIInsight().findById(i._id).lean();
    expect(upd.isRead).toBe(true);
    expect(upd.highlights).toContain('Revenue +3%');
  });

  it('automation template created from template creates a rule', async () => {
    const tmpl = await AutomationTemplate().create({ name: 'Test Alert Tmpl', description: 'For testing', category: 'replenishment', trigger: 'schedule', defaultSchedule: '0 6 * * *', isBuiltIn: false, actionTemplate: [{ type: 'notify', config: { channel: 'slack' }, order: 1, onFailure: 'continue' }] });
    const rule = await AutomationRule().create({
      name: `${tmpl.name} — Rule`,
      description: tmpl.description,
      trigger: tmpl.trigger,
      category: tmpl.category,
      schedule: tmpl.defaultSchedule,
      actions: tmpl.actionTemplate,
      templateId: tmpl._id,
    });
    await AutomationTemplate().findByIdAndUpdate(tmpl._id, { $inc: { useCount: 1 } });
    const upd = await AutomationTemplate().findById(tmpl._id).lean();
    expect(rule.trigger).toBe('schedule');
    expect(rule.actions).toHaveLength(1);
    expect(upd.useCount).toBe(1);
  });
});
