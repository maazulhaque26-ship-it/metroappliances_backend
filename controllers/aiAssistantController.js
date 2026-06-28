const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');

const AIAssistant = () => mongoose.model('AIAssistant');
const AIPrompt    = () => mongoose.model('AIPrompt');
const AIFeedback  = () => mongoose.model('AIFeedback');

// ── Assistants ────────────────────────────────────────────────────────────────
exports.listAssistants = async (req, res) => {
  try {
    const data = await AIAssistant().find({ isActive: true }).sort({ isDefault: -1, name: 1 }).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};

exports.getAssistant = async (req, res) => {
  try {
    const a = await AIAssistant().findById(req.params.id).lean();
    if (!a) return notFound(res, 'Assistant not found');
    ok(res, a);
  } catch (e) { serverError(res, e); }
};

exports.createAssistant = async (req, res) => {
  try {
    const { name, description, type, persona, systemPrompt, capabilities, config } = req.body || {};
    const a = await AIAssistant().create({ name, description, type, persona, systemPrompt, capabilities, config, createdBy: req.user?._id });
    created(res, a);
  } catch (e) { serverError(res, e); }
};

exports.updateAssistant = async (req, res) => {
  try {
    const a = await AIAssistant().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!a) return notFound(res, 'Assistant not found');
    ok(res, a);
  } catch (e) { serverError(res, e); }
};

exports.deleteAssistant = async (req, res) => {
  try {
    await AIAssistant().findByIdAndUpdate(req.params.id, { isActive: false });
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.seedDefaultAssistants = async (req, res) => {
  try {
    const defaults = [
      { name: 'ERP Copilot', type: 'erp', description: 'General ERP assistant for all modules', isDefault: true, capabilities: ['query','suggest','summarize'], isActive: true },
      { name: 'Finance Assistant', type: 'finance', description: 'Finance, AR/AP, cash flow and GL specialist', capabilities: ['finance_query','alert','report'], isActive: true },
      { name: 'HR Assistant', type: 'hr', description: 'HR, payroll, attendance and recruitment assistant', capabilities: ['hr_query','remind','escalate'], isActive: true },
      { name: 'Operations Assistant', type: 'operations', description: 'Warehouse, inventory, procurement and logistics', capabilities: ['ops_query','replenish','schedule'], isActive: true },
      { name: 'Executive Assistant', type: 'executive', description: 'Executive briefings, KPI summaries and board reports', capabilities: ['brief','kpi','summarize','board'], isActive: true },
    ];
    const seeded = [];
    for (const d of defaults) {
      const exists = await AIAssistant().findOne({ name: d.name });
      if (!exists) seeded.push(await AIAssistant().create(d));
    }
    ok(res, { seeded: seeded.length });
  } catch (e) { serverError(res, e); }
};

// ── Prompts ───────────────────────────────────────────────────────────────────
exports.listPrompts = async (req, res) => {
  try {
    const { category, module, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (module)   filter.module   = module;
    const data = await AIPrompt().find(filter).sort({ useCount: -1, isBuiltIn: -1 }).limit(Number(limit)).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};

exports.getPrompt = async (req, res) => {
  try {
    const p = await AIPrompt().findById(req.params.id).lean();
    if (!p) return notFound(res, 'Prompt not found');
    ok(res, p);
  } catch (e) { serverError(res, e); }
};

exports.createPrompt = async (req, res) => {
  try {
    const p = await AIPrompt().create({ ...req.body, createdBy: req.user?._id });
    created(res, p);
  } catch (e) { serverError(res, e); }
};

exports.updatePrompt = async (req, res) => {
  try {
    const p = await AIPrompt().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return notFound(res, 'Prompt not found');
    ok(res, p);
  } catch (e) { serverError(res, e); }
};

exports.deletePrompt = async (req, res) => {
  try {
    await AIPrompt().findByIdAndUpdate(req.params.id, { isActive: false });
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.incrementPromptUse = async (req, res) => {
  try {
    const p = await AIPrompt().findByIdAndUpdate(req.params.id, { $inc: { useCount: 1 } }, { new: true });
    if (!p) return notFound(res, 'Prompt not found');
    ok(res, { useCount: p.useCount });
  } catch (e) { serverError(res, e); }
};

exports.seedBuiltInPrompts = async (req, res) => {
  try {
    const builtIn = [
      { category: 'sales',     title: "Today's Sales",             promptText: "Show today's sales",                    isBuiltIn: true },
      { category: 'finance',   title: 'Overdue Invoices',          promptText: 'Which invoices are overdue?',           isBuiltIn: true },
      { category: 'inventory', title: 'Low Stock Alert',           promptText: 'Which products require replenishment?', isBuiltIn: true },
      { category: 'projects',  title: 'Delayed Projects',          promptText: 'Show delayed projects',                 isBuiltIn: true },
      { category: 'general',   title: 'Maintenance Alert',         promptText: 'Which machines need maintenance?',      isBuiltIn: true },
      { category: 'general',   title: 'Production Summary',        promptText: 'Summarize today\'s production',         isBuiltIn: true },
      { category: 'finance',   title: 'Cash Flow Overview',        promptText: 'Explain cash flow',                     isBuiltIn: true },
      { category: 'general',   title: 'Pending Approvals',         promptText: 'List pending approvals',                isBuiltIn: true },
      { category: 'general',   title: 'Employees on Leave',        promptText: 'Find employees on leave',               isBuiltIn: true },
      { category: 'inventory', title: 'Inventory Shortage',        promptText: 'Show inventory shortages',              isBuiltIn: true },
      { category: 'executive', title: 'Executive Summary',         promptText: 'Generate executive summary',            isBuiltIn: true },
      { category: 'general',   title: 'Active Anomalies',          promptText: 'Show current anomalies and alerts',     isBuiltIn: true },
    ];
    const seeded = [];
    for (const p of builtIn) {
      const exists = await AIPrompt().findOne({ promptText: p.promptText });
      if (!exists) seeded.push(await AIPrompt().create(p));
    }
    ok(res, { seeded: seeded.length });
  } catch (e) { serverError(res, e); }
};

// ── Feedback ──────────────────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
  try {
    const { conversationId, insightId, knowledgeId, rating, thumbs, comment, category } = req.body || {};
    const f = await AIFeedback().create({ conversationId, insightId, knowledgeId, rating, thumbs, comment, category, userId: req.user?._id });
    created(res, f);
  } catch (e) { serverError(res, e); }
};

exports.getFeedbackStats = async (req, res) => {
  try {
    const [avgRating, byThumb, total] = await Promise.all([
      AIFeedback().aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
      AIFeedback().aggregate([{ $group: { _id: '$thumbs', count: { $sum: 1 } } }]),
      AIFeedback().countDocuments({}),
    ]);
    const avg = avgRating[0] || { avg: 0, count: 0 };
    const thumbsUp   = byThumb.find(t => t._id === 'up')?.count   || 0;
    const thumbsDown = byThumb.find(t => t._id === 'down')?.count || 0;
    const satisfactionRate = total > 0 ? Math.round(((thumbsUp) / Math.max(1, thumbsUp + thumbsDown)) * 100) : 0;
    ok(res, { total, avgRating: Math.round((avg.avg || 0) * 10) / 10, thumbsUp, thumbsDown, satisfactionRate });
  } catch (e) { serverError(res, e); }
};
