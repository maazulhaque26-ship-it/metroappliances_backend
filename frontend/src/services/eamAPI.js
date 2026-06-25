import axios from 'axios';

const BASE = '/api/admin/eam';

// ── EAM Dashboard ─────────────────────────────────────────────────────────────
export const fetchEAMDashboard         = ()          => axios.get(`${BASE}/dashboard`);
export const fetchAssetReliability     = (days)      => axios.get(`${BASE}/asset-reliability`, { params: { days } });
export const fetchMaintenanceTrend     = (days)      => axios.get(`${BASE}/maintenance-trend`, { params: { days } });
export const fetchBreakdownAnalysis    = (days)      => axios.get(`${BASE}/breakdown-analysis`, { params: { days } });
export const fetchCostAnalysis         = (days)      => axios.get(`${BASE}/cost-analysis`, { params: { days } });

// ── Assets ────────────────────────────────────────────────────────────────────
export const fetchAssets               = (params)    => axios.get(`${BASE}/assets`, { params });
export const fetchAsset                = (id)        => axios.get(`${BASE}/assets/${id}`);
export const createAsset               = (data)      => axios.post(`${BASE}/assets`, data);
export const updateAsset               = (id, data)  => axios.put(`${BASE}/assets/${id}`, data);
export const deleteAsset               = (id)        => axios.delete(`${BASE}/assets/${id}`);

// Asset sub-resources
export const fetchAssetHierarchy       = (assetId)        => axios.get(`${BASE}/assets/${assetId}/hierarchy`);
export const upsertAssetHierarchy      = (assetId, data)  => axios.put(`${BASE}/assets/${assetId}/hierarchy`, data);
export const fetchAssetDocuments       = (assetId)        => axios.get(`${BASE}/assets/${assetId}/documents`);
export const addAssetDocument          = (assetId, data)  => axios.post(`${BASE}/assets/${assetId}/documents`, data);
export const deleteAssetDocument       = (id)             => axios.delete(`${BASE}/asset-documents/${id}`);
export const fetchAssetDepreciation    = (assetId)        => axios.get(`${BASE}/assets/${assetId}/depreciation`);
export const createAssetDepreciation   = (assetId, data)  => axios.post(`${BASE}/assets/${assetId}/depreciation`, data);
export const fetchAssetWarranties      = (assetId)        => axios.get(`${BASE}/assets/${assetId}/warranties`);
export const createAssetWarranty       = (assetId, data)  => axios.post(`${BASE}/assets/${assetId}/warranties`, data);
export const updateAssetWarranty       = (id, data)       => axios.put(`${BASE}/asset-warranties/${id}`, data);
export const fetchAssetLifecycle       = (assetId, params) => axios.get(`${BASE}/assets/${assetId}/lifecycle`, { params });
export const addAssetLifecycleEvent    = (assetId, data)  => axios.post(`${BASE}/assets/${assetId}/lifecycle`, data);
export const fetchAssetHistory         = (assetId, params) => axios.get(`${BASE}/assets/${assetId}/history`, { params });

// ── Asset Categories ──────────────────────────────────────────────────────────
export const fetchAssetCategories      = (params)    => axios.get(`${BASE}/asset-categories`, { params });
export const createAssetCategory       = (data)      => axios.post(`${BASE}/asset-categories`, data);
export const updateAssetCategory       = (id, data)  => axios.put(`${BASE}/asset-categories/${id}`, data);
export const deleteAssetCategory       = (id)        => axios.delete(`${BASE}/asset-categories/${id}`);

// ── Asset Locations ───────────────────────────────────────────────────────────
export const fetchAssetLocations       = (params)    => axios.get(`${BASE}/asset-locations`, { params });
export const createAssetLocation       = (data)      => axios.post(`${BASE}/asset-locations`, data);
export const updateAssetLocation       = (id, data)  => axios.put(`${BASE}/asset-locations/${id}`, data);
export const deleteAssetLocation       = (id)        => axios.delete(`${BASE}/asset-locations/${id}`);

// ── Maintenance Plans ─────────────────────────────────────────────────────────
export const fetchMaintenancePlans     = (params)    => axios.get(`${BASE}/maintenance-plans`, { params });
export const fetchMaintenancePlan      = (id)        => axios.get(`${BASE}/maintenance-plans/${id}`);
export const createMaintenancePlan     = (data)      => axios.post(`${BASE}/maintenance-plans`, data);
export const updateMaintenancePlan     = (id, data)  => axios.put(`${BASE}/maintenance-plans/${id}`, data);
export const deleteMaintenancePlan     = (id)        => axios.delete(`${BASE}/maintenance-plans/${id}`);

// ── Maintenance Work Orders ───────────────────────────────────────────────────
export const fetchWorkOrders           = (params)    => axios.get(`${BASE}/work-orders`, { params });
export const fetchWorkOrder            = (id)        => axios.get(`${BASE}/work-orders/${id}`);
export const createWorkOrder           = (data)      => axios.post(`${BASE}/work-orders`, data);
export const updateWorkOrder           = (id, data)  => axios.put(`${BASE}/work-orders/${id}`, data);
export const deleteWorkOrder           = (id)        => axios.delete(`${BASE}/work-orders/${id}`);
export const transitionWorkOrder       = (id, data)  => axios.patch(`${BASE}/work-orders/${id}/transition`, data);
export const fetchWorkOrderParts       = (id)        => axios.get(`${BASE}/work-orders/${id}/parts`);
export const addWorkOrderPart          = (id, data)  => axios.post(`${BASE}/work-orders/${id}/parts`, data);
export const fetchWorkOrderTasks       = (woId)      => axios.get(`${BASE}/work-orders/${woId}/tasks`);
export const createWorkOrderTask       = (woId, data) => axios.post(`${BASE}/work-orders/${woId}/tasks`, data);
export const updateWorkOrderTask       = (id, data)  => axios.put(`${BASE}/tasks/${id}`, data);
export const deleteWorkOrderTask       = (id)        => axios.delete(`${BASE}/tasks/${id}`);

// ── Maintenance Requests ──────────────────────────────────────────────────────
export const fetchMaintenanceRequests  = (params)    => axios.get(`${BASE}/requests`, { params });
export const fetchMaintenanceRequest   = (id)        => axios.get(`${BASE}/requests/${id}`);
export const createMaintenanceRequest  = (data)      => axios.post(`${BASE}/requests`, data);
export const updateMaintenanceRequest  = (id, data)  => axios.put(`${BASE}/requests/${id}`, data);
export const convertRequestToWorkOrder = (id)        => axios.patch(`${BASE}/requests/${id}/convert`);

// ── Maintenance Schedules ─────────────────────────────────────────────────────
export const fetchMaintenanceSchedules = (params)    => axios.get(`${BASE}/schedules`, { params });
export const fetchMaintenanceSchedule  = (id)        => axios.get(`${BASE}/schedules/${id}`);
export const createMaintenanceSchedule = (data)      => axios.post(`${BASE}/schedules`, data);
export const updateMaintenanceSchedule = (id, data)  => axios.put(`${BASE}/schedules/${id}`, data);
export const deleteMaintenanceSchedule = (id)        => axios.delete(`${BASE}/schedules/${id}`);
export const completeSchedule          = (id, data)  => axios.patch(`${BASE}/schedules/${id}/complete`, data);
export const markSchedulesOverdue      = ()          => axios.post(`${BASE}/schedules/mark-overdue`);

// ── Maintenance Contracts ─────────────────────────────────────────────────────
export const fetchContracts            = (params)    => axios.get(`${BASE}/contracts`, { params });
export const fetchContract             = (id)        => axios.get(`${BASE}/contracts/${id}`);
export const createContract            = (data)      => axios.post(`${BASE}/contracts`, data);
export const updateContract            = (id, data)  => axios.put(`${BASE}/contracts/${id}`, data);
export const deleteContract            = (id)        => axios.delete(`${BASE}/contracts/${id}`);

// ── Maintenance Checklists ────────────────────────────────────────────────────
export const fetchChecklists           = (params)    => axios.get(`${BASE}/checklists`, { params });
export const createChecklist           = (data)      => axios.post(`${BASE}/checklists`, data);
export const updateChecklist           = (id, data)  => axios.put(`${BASE}/checklists/${id}`, data);
export const deleteChecklist           = (id)        => axios.delete(`${BASE}/checklists/${id}`);

// ── Maintenance History & Logs ────────────────────────────────────────────────
export const fetchMaintenanceHistory   = (params)    => axios.get(`${BASE}/maintenance-history`, { params });
export const createMaintenanceHistory  = (data)      => axios.post(`${BASE}/maintenance-history`, data);
export const fetchMaintenanceLogs      = (params)    => axios.get(`${BASE}/maintenance-logs`, { params });
export const createMaintenanceLog      = (data)      => axios.post(`${BASE}/maintenance-logs`, data);
export const updateMaintenanceLog      = (id, data)  => axios.put(`${BASE}/maintenance-logs/${id}`, data);

// ── Preventive & Predictive ───────────────────────────────────────────────────
export const fetchPreventive           = (params)    => axios.get(`${BASE}/preventive`, { params });
export const createPreventive          = (data)      => axios.post(`${BASE}/preventive`, data);
export const updatePreventive          = (id, data)  => axios.put(`${BASE}/preventive/${id}`, data);
export const fetchPredictive           = (params)    => axios.get(`${BASE}/predictive`, { params });
export const createPredictive          = (data)      => axios.post(`${BASE}/predictive`, data);
export const updatePredictive          = (id, data)  => axios.put(`${BASE}/predictive/${id}`, data);

// ── Maintenance Planner ───────────────────────────────────────────────────────
export const fetchPlanners             = (params)    => axios.get(`${BASE}/planners`, { params });
export const fetchPlanner              = (id)        => axios.get(`${BASE}/planners/${id}`);
export const createPlanner             = (data)      => axios.post(`${BASE}/planners`, data);
export const updatePlanner             = (id, data)  => axios.put(`${BASE}/planners/${id}`, data);
export const deletePlanner             = (id)        => axios.delete(`${BASE}/planners/${id}`);

// ── Vendor Maintenance ────────────────────────────────────────────────────────
export const fetchVendorServices       = (params)    => axios.get(`${BASE}/vendor-services`, { params });
export const createVendorService       = (data)      => axios.post(`${BASE}/vendor-services`, data);
export const updateVendorService       = (id, data)  => axios.put(`${BASE}/vendor-services/${id}`, data);
export const deleteVendorService       = (id)        => axios.delete(`${BASE}/vendor-services/${id}`);

// ── Condition Monitoring ──────────────────────────────────────────────────────
export const fetchConditionMonitors    = (params)    => axios.get(`${BASE}/condition-monitors`, { params });
export const fetchConditionMonitor     = (id)        => axios.get(`${BASE}/condition-monitors/${id}`);
export const createConditionMonitor    = (data)      => axios.post(`${BASE}/condition-monitors`, data);
export const updateConditionMonitor    = (id, data)  => axios.put(`${BASE}/condition-monitors/${id}`, data);
export const deleteConditionMonitor    = (id)        => axios.delete(`${BASE}/condition-monitors/${id}`);
export const addConditionReading       = (id, data)  => axios.post(`${BASE}/condition-monitors/${id}/reading`, data);

// ── Risk Assessments ──────────────────────────────────────────────────────────
export const fetchRiskAssessments      = (params)    => axios.get(`${BASE}/risk-assessments`, { params });
export const createRiskAssessment      = (data)      => axios.post(`${BASE}/risk-assessments`, data);
export const updateRiskAssessment      = (id, data)  => axios.put(`${BASE}/risk-assessments/${id}`, data);
export const deleteRiskAssessment      = (id)        => axios.delete(`${BASE}/risk-assessments/${id}`);

// ── Asset Calibrations (EAM) ──────────────────────────────────────────────────
export const fetchAssetCalibrations    = (params)    => axios.get(`${BASE}/asset-calibrations`, { params });
export const createAssetCalibration    = (data)      => axios.post(`${BASE}/asset-calibrations`, data);
export const updateAssetCalibration    = (id, data)  => axios.put(`${BASE}/asset-calibrations/${id}`, data);
export const deleteAssetCalibration    = (id)        => axios.delete(`${BASE}/asset-calibrations/${id}`);

// ── Asset Meters ──────────────────────────────────────────────────────────────
export const fetchMeters               = (params)    => axios.get(`${BASE}/meters`, { params });
export const fetchMeter                = (id)        => axios.get(`${BASE}/meters/${id}`);
export const createMeter               = (data)      => axios.post(`${BASE}/meters`, data);
export const updateMeter               = (id, data)  => axios.put(`${BASE}/meters/${id}`, data);
export const deleteMeter               = (id)        => axios.delete(`${BASE}/meters/${id}`);
export const fetchMeterReadings        = (meterId, params) => axios.get(`${BASE}/meters/${meterId}/readings`, { params });
export const addMeterReading           = (meterId, data)   => axios.post(`${BASE}/meters/${meterId}/readings`, data);

// ── Breakdowns ────────────────────────────────────────────────────────────────
export const fetchBreakdowns           = (params)    => axios.get(`${BASE}/breakdowns`, { params });
export const fetchBreakdown            = (id)        => axios.get(`${BASE}/breakdowns/${id}`);
export const createBreakdown           = (data)      => axios.post(`${BASE}/breakdowns`, data);
export const updateBreakdown           = (id, data)  => axios.put(`${BASE}/breakdowns/${id}`, data);
export const deleteBreakdown           = (id)        => axios.delete(`${BASE}/breakdowns/${id}`);
export const resolveBreakdown          = (id, data)  => axios.patch(`${BASE}/breakdowns/${id}/resolve`, data);

// ── Failure Analysis ──────────────────────────────────────────────────────────
export const fetchFailureAnalyses      = (params)    => axios.get(`${BASE}/failure-analyses`, { params });
export const createFailureAnalysis     = (data)      => axios.post(`${BASE}/failure-analyses`, data);
export const updateFailureAnalysis     = (id, data)  => axios.put(`${BASE}/failure-analyses/${id}`, data);
export const deleteFailureAnalysis     = (id)        => axios.delete(`${BASE}/failure-analyses/${id}`);
