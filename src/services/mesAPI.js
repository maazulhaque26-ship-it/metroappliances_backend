import API from './api';

// ─── Dashboard & Reports ──────────────────────────────────────────────────────
export const getMESDashboard        = ()       => API.get('/admin/mes/dashboard');
export const getProductionTrend     = (p = {}) => API.get('/admin/mes/reports/production-trend', { params: p });
export const getOEETrend            = (p = {}) => API.get('/admin/mes/reports/oee-trend', { params: p });
export const getDowntimeAnalysis    = (p = {}) => API.get('/admin/mes/reports/downtime-analysis', { params: p });
export const getQualityTrend        = (p = {}) => API.get('/admin/mes/reports/quality-trend', { params: p });
export const getLaborReport         = (p = {}) => API.get('/admin/mes/reports/labor', { params: p });
export const getProductionEvents    = (p = {}) => API.get('/admin/mes/events', { params: p });

// ─── Work Orders ─────────────────────────────────────────────────────────────
export const getWorkOrders          = (p = {}) => API.get('/admin/mes/work-orders', { params: p });
export const createWorkOrder        = (d)      => API.post('/admin/mes/work-orders', d);
export const getWorkOrder           = (id)     => API.get(`/admin/mes/work-orders/${id}`);
export const updateWorkOrder        = (id, d)  => API.put(`/admin/mes/work-orders/${id}`, d);
export const deleteWorkOrder        = (id)     => API.delete(`/admin/mes/work-orders/${id}`);
export const releaseWorkOrder       = (id)     => API.patch(`/admin/mes/work-orders/${id}/release`);
export const startWorkOrder         = (id)     => API.patch(`/admin/mes/work-orders/${id}/start`);
export const pauseWorkOrder         = (id)     => API.patch(`/admin/mes/work-orders/${id}/pause`);
export const completeWorkOrder      = (id)     => API.patch(`/admin/mes/work-orders/${id}/complete`);
export const cancelWorkOrder        = (id)     => API.patch(`/admin/mes/work-orders/${id}/cancel`);

// Work Order Operations
export const createOperation        = (woId, d)           => API.post(`/admin/mes/work-orders/${woId}/operations`, d);
export const updateOperation        = (woId, opId, d)     => API.put(`/admin/mes/work-orders/${woId}/operations/${opId}`, d);
export const completeOperation      = (woId, opId, d)     => API.patch(`/admin/mes/work-orders/${woId}/operations/${opId}/complete`, d);

// ─── Production Execution ─────────────────────────────────────────────────────
export const getExecutions          = (p = {}) => API.get('/admin/mes/executions', { params: p });
export const startExecution         = (d)      => API.post('/admin/mes/executions/start', d);
export const getExecution           = (id)     => API.get(`/admin/mes/executions/${id}`);
export const updateExecution        = (id, d)  => API.put(`/admin/mes/executions/${id}`, d);
export const pauseExecution         = (id, d)  => API.patch(`/admin/mes/executions/${id}/pause`, d);
export const completeExecution      = (id, d)  => API.patch(`/admin/mes/executions/${id}/complete`, d);
export const getOperationExecutions = (p = {}) => API.get('/admin/mes/operation-executions', { params: p });
export const recordOperationExecution = (d)    => API.post('/admin/mes/operation-executions', d);

// ─── Quality ─────────────────────────────────────────────────────────────────
export const getInspections         = (p = {}) => API.get('/admin/mes/quality/inspections', { params: p });
export const createInspection       = (d)      => API.post('/admin/mes/quality/inspections', d);
export const getInspection          = (id)     => API.get(`/admin/mes/quality/inspections/${id}`);
export const updateInspection       = (id, d)  => API.put(`/admin/mes/quality/inspections/${id}`, d);
export const deleteInspection       = (id)     => API.delete(`/admin/mes/quality/inspections/${id}`);

export const getCheckpoints         = (p = {}) => API.get('/admin/mes/quality/checkpoints', { params: p });
export const createCheckpoint       = (d)      => API.post('/admin/mes/quality/checkpoints', d);
export const updateCheckpoint       = (id, d)  => API.put(`/admin/mes/quality/checkpoints/${id}`, d);
export const deleteCheckpoint       = (id)     => API.delete(`/admin/mes/quality/checkpoints/${id}`);

export const getDefects             = (p = {}) => API.get('/admin/mes/quality/defects', { params: p });
export const createDefect           = (d)      => API.post('/admin/mes/quality/defects', d);
export const getDefect              = (id)     => API.get(`/admin/mes/quality/defects/${id}`);
export const updateDefect           = (id, d)  => API.put(`/admin/mes/quality/defects/${id}`, d);

export const getScrap               = (p = {}) => API.get('/admin/mes/quality/scrap', { params: p });
export const createScrap            = (d)      => API.post('/admin/mes/quality/scrap', d);
export const updateScrap            = (id, d)  => API.put(`/admin/mes/quality/scrap/${id}`, d);

export const getRework              = (p = {}) => API.get('/admin/mes/quality/rework', { params: p });
export const createRework           = (d)      => API.post('/admin/mes/quality/rework', d);
export const updateRework           = (id, d)  => API.put(`/admin/mes/quality/rework/${id}`, d);

// ─── OEE ─────────────────────────────────────────────────────────────────────
export const getOEERecords          = (p = {}) => API.get('/admin/mes/oee', { params: p });
export const recordOEE              = (d)      => API.post('/admin/mes/oee', d);
export const getOEESummary          = (p = {}) => API.get('/admin/mes/oee/summary', { params: p });
export const getOEERecord           = (id)     => API.get(`/admin/mes/oee/${id}`);

export const getMachineRuntimes     = (p = {}) => API.get('/admin/mes/machine-runtime', { params: p });
export const getMachineRuntime      = (id)     => API.get(`/admin/mes/machine-runtime/${id}`);
export const updateMachineRuntime   = (id, d)  => API.put(`/admin/mes/machine-runtime/${id}`, d);

// ─── Downtime ─────────────────────────────────────────────────────────────────
export const getDowntimes           = (p = {}) => API.get('/admin/mes/downtime', { params: p });
export const createDowntime         = (d)      => API.post('/admin/mes/downtime', d);
export const getDowntime            = (id)     => API.get(`/admin/mes/downtime/${id}`);
export const resolveDowntime        = (id, d)  => API.patch(`/admin/mes/downtime/${id}/resolve`, d);
export const deleteDowntime         = (id)     => API.delete(`/admin/mes/downtime/${id}`);

export const getDowntimeReasons     = (p = {}) => API.get('/admin/mes/downtime-reasons', { params: p });
export const createDowntimeReason   = (d)      => API.post('/admin/mes/downtime-reasons', d);
export const updateDowntimeReason   = (id, d)  => API.put(`/admin/mes/downtime-reasons/${id}`, d);
export const deleteDowntimeReason   = (id)     => API.delete(`/admin/mes/downtime-reasons/${id}`);

export const getMaintenanceTriggers  = (p = {}) => API.get('/admin/mes/maintenance-triggers', { params: p });
export const createMaintenanceTrigger = (d)     => API.post('/admin/mes/maintenance-triggers', d);
export const getMaintenanceTrigger   = (id)     => API.get(`/admin/mes/maintenance-triggers/${id}`);
export const updateMaintenanceTrigger = (id, d) => API.put(`/admin/mes/maintenance-triggers/${id}`, d);
export const deleteMaintenanceTrigger = (id)    => API.delete(`/admin/mes/maintenance-triggers/${id}`);

// ─── Tools ───────────────────────────────────────────────────────────────────
export const getTools               = (p = {}) => API.get('/admin/mes/tools', { params: p });
export const createTool             = (d)      => API.post('/admin/mes/tools', d);
export const getTool                = (id)     => API.get(`/admin/mes/tools/${id}`);
export const updateTool             = (id, d)  => API.put(`/admin/mes/tools/${id}`, d);
export const deleteTool             = (id)     => API.delete(`/admin/mes/tools/${id}`);

export const getToolUsages          = (p = {}) => API.get('/admin/mes/tool-usage', { params: p });
export const startToolUsage         = (d)      => API.post('/admin/mes/tool-usage/start', d);
export const endToolUsage           = (id, d)  => API.patch(`/admin/mes/tool-usage/${id}/end`, d);

export const getCalibrations        = (p = {}) => API.get('/admin/mes/tool-calibrations', { params: p });
export const createCalibration      = (d)      => API.post('/admin/mes/tool-calibrations', d);

// ─── Operators ────────────────────────────────────────────────────────────────
export const getShiftAssignments    = (p = {}) => API.get('/admin/mes/operator-shifts', { params: p });
export const assignShift            = (d)      => API.post('/admin/mes/operator-shifts', d);
export const updateShiftAssignment  = (id, d)  => API.put(`/admin/mes/operator-shifts/${id}`, d);
export const deleteShiftAssignment  = (id)     => API.delete(`/admin/mes/operator-shifts/${id}`);

export const getAttendance          = (p = {}) => API.get('/admin/mes/attendance', { params: p });
export const recordAttendance       = (d)      => API.post('/admin/mes/attendance', d);
export const clockOut               = (id, d)  => API.patch(`/admin/mes/attendance/${id}/clock-out`, d);

export const getSkills              = (p = {}) => API.get('/admin/mes/operator-skills', { params: p });
export const addSkill               = (d)      => API.post('/admin/mes/operator-skills', d);
export const updateSkill            = (id, d)  => API.put(`/admin/mes/operator-skills/${id}`, d);
export const deleteSkill            = (id)     => API.delete(`/admin/mes/operator-skills/${id}`);

// ─── Labor ───────────────────────────────────────────────────────────────────
export const getLaborEntries        = (p = {}) => API.get('/admin/mes/labor', { params: p });
export const createLaborEntry       = (d)      => API.post('/admin/mes/labor', d);
export const getLaborSummary        = (p = {}) => API.get('/admin/mes/labor/summary', { params: p });
export const getLaborEntry          = (id)     => API.get(`/admin/mes/labor/${id}`);
export const updateLaborEntry       = (id, d)  => API.put(`/admin/mes/labor/${id}`, d);
export const deleteLaborEntry       = (id)     => API.delete(`/admin/mes/labor/${id}`);
