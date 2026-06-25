import API from './api';

// MRP Dashboard & Reports
export const getMRPDashboard            = ()          => API.get('/admin/mrp/dashboard');
export const getShortageReport          = (p={})      => API.get('/admin/mrp/reports/shortages', { params: p });
export const getInventoryRiskReport     = (p={})      => API.get('/admin/mrp/reports/inventory-risk', { params: p });
export const getForecastAccuracyReport  = (p={})      => API.get('/admin/mrp/reports/forecast-accuracy', { params: p });

// MRP Runs
export const runMRP     = (data)  => API.post('/admin/mrp/runs', data);
export const getMRPRuns = (p={})  => API.get('/admin/mrp/runs', { params: p });
export const getMRPRun  = (id)    => API.get(`/admin/mrp/runs/${id}`);
export const cancelMRPRun = (id)  => API.patch(`/admin/mrp/runs/${id}/cancel`);

// Material Requirements
export const getRequirements      = (p={})  => API.get('/admin/mrp/requirements', { params: p });
export const getRequirement       = (id)    => API.get(`/admin/mrp/requirements/${id}`);
export const getRequirementsByRun = (runId) => API.get(`/admin/mrp/runs/${runId}/requirements`);

// MRP Reservations
export const getReservations      = (p={})  => API.get('/admin/mrp/reservations', { params: p });
export const getReservation       = (id)    => API.get(`/admin/mrp/reservations/${id}`);
export const releaseReservation   = (id)    => API.patch(`/admin/mrp/reservations/${id}/release`);

// Shortages
export const getShortages   = (p={})  => API.get('/admin/mrp/shortages', { params: p });
export const getShortage    = (id)    => API.get(`/admin/mrp/shortages/${id}`);
export const resolveShortage= (id, data={}) => API.patch(`/admin/mrp/shortages/${id}/resolve`, data);
export const ignoreShortage = (id, data={}) => API.patch(`/admin/mrp/shortages/${id}/ignore`, data);

// Recommendations
export const getRecommendations    = (p={})  => API.get('/admin/mrp/recommendations', { params: p });
export const getRecommendation     = (id)    => API.get(`/admin/mrp/recommendations/${id}`);
export const acceptRecommendation  = (id)    => API.patch(`/admin/mrp/recommendations/${id}/accept`);
export const rejectRecommendation  = (id, data={}) => API.patch(`/admin/mrp/recommendations/${id}/reject`, data);

// Purchase Suggestions
export const getPurchaseSuggestions      = (p={})  => API.get('/admin/mrp/purchase-suggestions', { params: p });
export const approvePurchaseSuggestion   = (id)    => API.patch(`/admin/mrp/purchase-suggestions/${id}/approve`);
export const rejectPurchaseSuggestion    = (id, data={}) => API.patch(`/admin/mrp/purchase-suggestions/${id}/reject`, data);

// Demand Forecasts
export const getForecasts    = (p={})  => API.get('/admin/mrp/forecasts', { params: p });
export const getForecast     = (id)    => API.get(`/admin/mrp/forecasts/${id}`);
export const createForecast  = (data)  => API.post('/admin/mrp/forecasts', data);
export const updateForecast  = (id, data) => API.put(`/admin/mrp/forecasts/${id}`, data);
export const approveForecast = (id)    => API.patch(`/admin/mrp/forecasts/${id}/approve`);
export const deleteForecast  = (id)    => API.delete(`/admin/mrp/forecasts/${id}`);

// Inventory Projections
export const getProjections       = (p={})  => API.get('/admin/mrp/projections', { params: p });
export const getProjection        = (id)    => API.get(`/admin/mrp/projections/${id}`);
export const getProjectionsByRun  = (runId) => API.get(`/admin/mrp/runs/${runId}/projections`);

// Safety Stock Rules
export const getSafetyStockRules  = (p={})  => API.get('/admin/mrp/safety-stock', { params: p });
export const getSafetyStockRule   = (id)    => API.get(`/admin/mrp/safety-stock/${id}`);
export const createSafetyStockRule= (data)  => API.post('/admin/mrp/safety-stock', data);
export const updateSafetyStockRule= (id, data) => API.put(`/admin/mrp/safety-stock/${id}`, data);
export const deleteSafetyStockRule= (id)    => API.delete(`/admin/mrp/safety-stock/${id}`);
