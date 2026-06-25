import api from './api';

// ── Manufacturing Dashboard ────────────────────────────────────────────────────
export const getDashboard       = ()       => api.get('/admin/manufacturing/dashboard');
export const getProductionTrend = (days=7) => api.get(`/admin/manufacturing/trend?days=${days}`);
export const getOEEReport       = ()       => api.get('/admin/manufacturing/oee');
export const getShiftPerformance = ()      => api.get('/admin/manufacturing/shift-performance');

// ── Factories ─────────────────────────────────────────────────────────────────
export const getFactories    = (p = {})   => api.get('/admin/factories', { params: p });
export const getFactory      = (id)       => api.get(`/admin/factories/${id}`);
export const createFactory   = (data)     => api.post('/admin/factories', data);
export const updateFactory   = (id, data) => api.put(`/admin/factories/${id}`, data);
export const deleteFactory   = (id)       => api.delete(`/admin/factories/${id}`);

// ── Work Centers ──────────────────────────────────────────────────────────────
export const getWorkCenters   = (p = {})   => api.get('/admin/work-centers', { params: p });
export const getWorkCenter    = (id)       => api.get(`/admin/work-centers/${id}`);
export const createWorkCenter = (data)     => api.post('/admin/work-centers', data);
export const updateWorkCenter = (id, data) => api.put(`/admin/work-centers/${id}`, data);
export const deleteWorkCenter = (id)       => api.delete(`/admin/work-centers/${id}`);

// ── Machines ──────────────────────────────────────────────────────────────────
export const getMachines       = (p = {})    => api.get('/admin/machines', { params: p });
export const getMachine        = (id)        => api.get(`/admin/machines/${id}`);
export const createMachine     = (data)      => api.post('/admin/machines', data);
export const updateMachine     = (id, data)  => api.put(`/admin/machines/${id}`, data);
export const deleteMachine     = (id)        => api.delete(`/admin/machines/${id}`);
export const updateMachineStatus = (id, status) => api.patch(`/admin/machines/${id}/status`, { status });
export const logMaintenance    = (id, data)  => api.post(`/admin/machines/${id}/maintenance`, data);

// ── Shifts ────────────────────────────────────────────────────────────────────
export const getShifts    = (p = {})   => api.get('/admin/shifts', { params: p });
export const getShift     = (id)       => api.get(`/admin/shifts/${id}`);
export const createShift  = (data)     => api.post('/admin/shifts', data);
export const updateShift  = (id, data) => api.put(`/admin/shifts/${id}`, data);
export const deleteShift  = (id)       => api.delete(`/admin/shifts/${id}`);

// ── Bill of Materials ─────────────────────────────────────────────────────────
export const getBOMs         = (p = {})   => api.get('/admin/bom', { params: p });
export const getBOM          = (id)       => api.get(`/admin/bom/${id}`);
export const getBOMByProduct = (pid)      => api.get(`/admin/bom/product/${pid}`);
export const createBOM       = (data)     => api.post('/admin/bom', data);
export const updateBOM       = (id, data) => api.put(`/admin/bom/${id}`, data);
export const deleteBOM       = (id)       => api.delete(`/admin/bom/${id}`);
export const approveBOM      = (id)       => api.patch(`/admin/bom/${id}/approve`);
export const cloneBOM        = (id)       => api.post(`/admin/bom/${id}/clone`);

// ── Production Orders ─────────────────────────────────────────────────────────
export const getOrders      = (p = {})    => api.get('/admin/production-orders', { params: p });
export const getOrder       = (id)        => api.get(`/admin/production-orders/${id}`);
export const createOrder    = (data)      => api.post('/admin/production-orders', data);
export const updateOrder    = (id, data)  => api.put(`/admin/production-orders/${id}`, data);
export const deleteOrder    = (id)        => api.delete(`/admin/production-orders/${id}`);
export const startOrder     = (id, data)  => api.patch(`/admin/production-orders/${id}/start`, data || {});
export const pauseOrder     = (id, data)  => api.patch(`/admin/production-orders/${id}/pause`, data || {});
export const completeOrder  = (id, data)  => api.patch(`/admin/production-orders/${id}/complete`, data || {});
export const cancelOrder    = (id, data)  => api.patch(`/admin/production-orders/${id}/cancel`, data || {});
export const createBatch    = (id, data)  => api.post(`/admin/production-orders/${id}/batches`, data);
export const updateBatch    = (id, bid, data) => api.put(`/admin/production-orders/${id}/batches/${bid}`, data);
