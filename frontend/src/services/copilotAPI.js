import axios from 'axios';

const BASE = '/api/admin/copilot';
const cfg  = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
const qcfg = (params = {}) => ({ ...cfg(), params });

// ── Conversations ─────────────────────────────────────────────────────────────
export const listConversations  = (params = {}) => axios.get(`${BASE}/conversations`, qcfg(params));
export const createConversation = (data = {})   => axios.post(`${BASE}/conversations`, data, cfg());
export const getConversation    = (id)           => axios.get(`${BASE}/conversations/${id}`, cfg());
export const deleteConversation = (id)           => axios.delete(`${BASE}/conversations/${id}`, cfg());
export const sendMessage        = (id, data)     => axios.post(`${BASE}/conversations/${id}/message`, data, cfg());

// ── Suggestions ───────────────────────────────────────────────────────────────
export const listSuggestions    = (params = {}) => axios.get(`${BASE}/suggestions`, qcfg(params));
export const generateSuggestions = ()           => axios.post(`${BASE}/suggestions/generate`, {}, cfg());
export const applySuggestion    = (id)          => axios.patch(`${BASE}/suggestions/${id}/apply`, {}, cfg());
export const dismissSuggestion  = (id)          => axios.patch(`${BASE}/suggestions/${id}/dismiss`, {}, cfg());

// ── Tasks & Actions ───────────────────────────────────────────────────────────
export const listTasks          = (params = {}) => axios.get(`${BASE}/tasks`, qcfg(params));
export const createTask         = (data = {})   => axios.post(`${BASE}/tasks`, data, cfg());
export const getTask            = (id)          => axios.get(`${BASE}/tasks/${id}`, cfg());
export const listActions        = (params = {}) => axios.get(`${BASE}/actions`, qcfg(params));

// ── Insights ──────────────────────────────────────────────────────────────────
export const generateDailyBriefing      = (data = {}) => axios.post(`${BASE}/insights/daily-briefing`, data, cfg());
export const generateDeptSummary        = (data = {}) => axios.post(`${BASE}/insights/dept-summary`, data, cfg());
export const generateKPIDigest          = (data = {}) => axios.post(`${BASE}/insights/kpi-digest`, data, cfg());
export const generateMonthlySummary     = (data = {}) => axios.post(`${BASE}/insights/monthly-summary`, data, cfg());
export const generateRiskSummary        = (data = {}) => axios.post(`${BASE}/insights/risk-summary`, data, cfg());
export const generateOpportunitySummary = (data = {}) => axios.post(`${BASE}/insights/opportunity-summary`, data, cfg());
export const listInsights               = (params = {}) => axios.get(`${BASE}/insights`, qcfg(params));
export const getInsight                 = (id)          => axios.get(`${BASE}/insights/${id}`, cfg());
export const deleteInsight              = (id)          => axios.delete(`${BASE}/insights/${id}`, cfg());

// ── Automation — Rules ────────────────────────────────────────────────────────
export const getAutomationStats = ()            => axios.get(`${BASE}/automation/stats`, cfg());
export const listRules          = (params = {}) => axios.get(`${BASE}/automation/rules`, qcfg(params));
export const createRule         = (data = {})   => axios.post(`${BASE}/automation/rules`, data, cfg());
export const getRule            = (id)          => axios.get(`${BASE}/automation/rules/${id}`, cfg());
export const updateRule         = (id, data)    => axios.put(`${BASE}/automation/rules/${id}`, data, cfg());
export const deleteRule         = (id)          => axios.delete(`${BASE}/automation/rules/${id}`, cfg());
export const toggleRule         = (id)          => axios.patch(`${BASE}/automation/rules/${id}/toggle`, {}, cfg());
export const executeRule        = (id)          => axios.post(`${BASE}/automation/rules/${id}/execute`, {}, cfg());
export const testRule           = (id)          => axios.post(`${BASE}/automation/rules/${id}/test`, {}, cfg());

// ── Automation — Executions & History ─────────────────────────────────────────
export const listExecutions     = (params = {}) => axios.get(`${BASE}/automation/executions`, qcfg(params));
export const getExecution       = (id)          => axios.get(`${BASE}/automation/executions/${id}`, cfg());
export const listHistory        = (params = {}) => axios.get(`${BASE}/automation/history`, qcfg(params));

// ── Automation — Templates ────────────────────────────────────────────────────
export const listTemplates      = (params = {}) => axios.get(`${BASE}/automation/templates`, qcfg(params));
export const seedTemplates      = ()            => axios.post(`${BASE}/automation/templates/seed`, {}, cfg());
export const createFromTemplate = (id, data={}) => axios.post(`${BASE}/automation/templates/${id}/create-rule`, data, cfg());

// ── Knowledge Base ────────────────────────────────────────────────────────────
export const listKnowledge      = (params = {}) => axios.get(`${BASE}/knowledge`, qcfg(params));
export const createKnowledge    = (data = {})   => axios.post(`${BASE}/knowledge`, data, cfg());
export const searchKnowledge    = (q, params={})=> axios.get(`${BASE}/knowledge/search`, qcfg({ q, ...params }));
export const seedKnowledge      = ()            => axios.post(`${BASE}/knowledge/seed`, {}, cfg());
export const getKnowledgeByModule = (module)   => axios.get(`${BASE}/knowledge/module/${module}`, cfg());
export const getKnowledge       = (id)          => axios.get(`${BASE}/knowledge/${id}`, cfg());
export const updateKnowledge    = (id, data)    => axios.put(`${BASE}/knowledge/${id}`, data, cfg());
export const deleteKnowledge    = (id)          => axios.delete(`${BASE}/knowledge/${id}`, cfg());
export const incrementKnowledgeUse = (id)      => axios.post(`${BASE}/knowledge/${id}/use`, {}, cfg());

// ── Assistants ────────────────────────────────────────────────────────────────
export const listAssistants     = ()            => axios.get(`${BASE}/assistants`, cfg());
export const createAssistant    = (data = {})   => axios.post(`${BASE}/assistants`, data, cfg());
export const seedAssistants     = ()            => axios.post(`${BASE}/assistants/seed`, {}, cfg());
export const getAssistant       = (id)          => axios.get(`${BASE}/assistants/${id}`, cfg());
export const updateAssistant    = (id, data)    => axios.put(`${BASE}/assistants/${id}`, data, cfg());
export const deleteAssistant    = (id)          => axios.delete(`${BASE}/assistants/${id}`, cfg());

// ── Prompts ───────────────────────────────────────────────────────────────────
export const listPrompts        = (params = {}) => axios.get(`${BASE}/prompts`, qcfg(params));
export const createPrompt       = (data = {})   => axios.post(`${BASE}/prompts`, data, cfg());
export const seedPrompts        = ()            => axios.post(`${BASE}/prompts/seed`, {}, cfg());
export const getPrompt          = (id)          => axios.get(`${BASE}/prompts/${id}`, cfg());
export const updatePrompt       = (id, data)    => axios.put(`${BASE}/prompts/${id}`, data, cfg());
export const deletePrompt       = (id)          => axios.delete(`${BASE}/prompts/${id}`, cfg());
export const incrementPromptUse = (id)         => axios.post(`${BASE}/prompts/${id}/use`, {}, cfg());

// ── Feedback ──────────────────────────────────────────────────────────────────
export const submitFeedback     = (data = {})   => axios.post(`${BASE}/feedback`, data, cfg());
export const getFeedbackStats   = ()            => axios.get(`${BASE}/feedback/stats`, cfg());
