import api from './api';

// ── Planning Dashboard ────────────────────────────────────────────────────────
export const getPlanningDashboard    = (p = {}) => api.get('/admin/planning/dashboard',            { params: p });
export const getScheduleAdherence   = (p = {}) => api.get('/admin/planning/schedule-adherence',   { params: p });
export const getCapacityForecast    = (p = {}) => api.get('/admin/planning/capacity-forecast',    { params: p });
export const getResourceUtilization = (p = {}) => api.get('/admin/planning/resource-utilization', { params: p });

// ── Production Plans ──────────────────────────────────────────────────────────
export const getPlans     = (p = {})    => api.get('/admin/production-plans', { params: p });
export const getPlan      = (id)        => api.get(`/admin/production-plans/${id}`);
export const createPlan   = (data)      => api.post('/admin/production-plans', data);
export const updatePlan   = (id, data)  => api.put(`/admin/production-plans/${id}`, data);
export const deletePlan   = (id)        => api.delete(`/admin/production-plans/${id}`);
export const submitPlan   = (id, data)  => api.patch(`/admin/production-plans/${id}/submit`,  data || {});
export const reviewPlan   = (id, data)  => api.patch(`/admin/production-plans/${id}/review`,  data || {});
export const approvePlan  = (id, data)  => api.patch(`/admin/production-plans/${id}/approve`, data || {});
export const releasePlan  = (id, data)  => api.patch(`/admin/production-plans/${id}/release`, data || {});
export const cancelPlan   = (id, data)  => api.patch(`/admin/production-plans/${id}/cancel`,  data || {});
export const clonePlan    = (id)        => api.post(`/admin/production-plans/${id}/clone`);

// ── Capacity Planning ─────────────────────────────────────────────────────────
export const getCapacityAnalysis   = (p = {})      => api.get('/admin/capacity-planning/analysis', { params: p });
export const getFactoryCapacity    = (fid, p = {}) => api.get(`/admin/capacity-planning/factory/${fid}`, { params: p });
export const getBottlenecks        = (p = {})      => api.get('/admin/capacity-planning/bottlenecks', { params: p });
export const getCapacityPlans      = (p = {})      => api.get('/admin/capacity-planning', { params: p });
export const createCapacityPlan    = (data)        => api.post('/admin/capacity-planning', data);
export const updateCapacityPlan    = (id, data)    => api.put(`/admin/capacity-planning/${id}`, data);

// ── Machine Calendar ──────────────────────────────────────────────────────────
export const getMachineCalendar      = (p = {}) => api.get('/admin/machine-calendar', { params: p });
export const getMachineCalendarBulk  = (p = {}) => api.get('/admin/machine-calendar/bulk', { params: p });
export const setMachineAvailability  = (data)   => api.post('/admin/machine-calendar', data);

// ── Production Calendar ───────────────────────────────────────────────────────
export const getProductionCalendar  = (p = {}) => api.get('/admin/production-calendar', { params: p });
export const setProductionDay       = (data)   => api.post('/admin/production-calendar', data);
export const generateCalendar       = (data)   => api.post('/admin/production-calendar/generate', data);

// ── Holiday Calendar ──────────────────────────────────────────────────────────
export const getHolidays    = (p = {})    => api.get('/admin/holidays', { params: p });
export const createHoliday  = (data)      => api.post('/admin/holidays', data);
export const updateHoliday  = (id, data)  => api.put(`/admin/holidays/${id}`, data);
export const deleteHoliday  = (id)        => api.delete(`/admin/holidays/${id}`);

// ── Planning Constraints ──────────────────────────────────────────────────────
export const getConstraints    = (p = {})    => api.get('/admin/planning-constraints', { params: p });
export const createConstraint  = (data)      => api.post('/admin/planning-constraints', data);
export const updateConstraint  = (id, data)  => api.put(`/admin/planning-constraints/${id}`, data);
export const deleteConstraint  = (id)        => api.delete(`/admin/planning-constraints/${id}`);

// ── Planning Scenarios ────────────────────────────────────────────────────────
export const getScenarios    = (p = {})    => api.get('/admin/planning-scenarios', { params: p });
export const createScenario  = (data)      => api.post('/admin/planning-scenarios', data);
export const updateScenario  = (id, data)  => api.put(`/admin/planning-scenarios/${id}`, data);
export const deleteScenario  = (id)        => api.delete(`/admin/planning-scenarios/${id}`);
