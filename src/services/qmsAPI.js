import API from './api';

// ── QMS Dashboard ─────────────────────────────────────────────────────────────
export const getQMSDashboard                = ()       => API.get('/admin/qms/dashboard');
export const getQMSInspectionTrend          = (p = {}) => API.get('/admin/qms/dashboard/inspection-trend', { params: p });
export const getQMSCAPATrend               = (p = {}) => API.get('/admin/qms/dashboard/capa-trend', { params: p });
export const getQMSNCRAnalysis             = (p = {}) => API.get('/admin/qms/dashboard/ncr-analysis', { params: p });
export const getQMSAuditSummary            = ()       => API.get('/admin/qms/dashboard/audit-summary');
export const getQMSCalibrationSummary      = ()       => API.get('/admin/qms/dashboard/calibration-summary');
export const getQMSSupplierQualitySummary  = ()       => API.get('/admin/qms/dashboard/supplier-quality-summary');

// ── Inspection Plans ──────────────────────────────────────────────────────────
export const getInspectionPlans   = (p = {}) => API.get('/admin/qms/inspection-plans', { params: p });
export const createInspectionPlan = (d)      => API.post('/admin/qms/inspection-plans', d);
export const getInspectionPlan    = (id)     => API.get(`/admin/qms/inspection-plans/${id}`);
export const updateInspectionPlan = (id, d)  => API.put(`/admin/qms/inspection-plans/${id}`, d);
export const deleteInspectionPlan = (id)     => API.delete(`/admin/qms/inspection-plans/${id}`);

// Characteristics
export const getCharacteristics    = (planId)         => API.get(`/admin/qms/inspection-plans/${planId}/characteristics`);
export const createCharacteristic  = (planId, d)      => API.post(`/admin/qms/inspection-plans/${planId}/characteristics`, d);
export const updateCharacteristic  = (planId, charId, d) => API.put(`/admin/qms/inspection-plans/${planId}/characteristics/${charId}`, d);
export const deleteCharacteristic  = (planId, charId) => API.delete(`/admin/qms/inspection-plans/${planId}/characteristics/${charId}`);

// Inspection Methods
export const getInspectionMethods   = (p = {}) => API.get('/admin/qms/inspection-methods', { params: p });
export const createInspectionMethod = (d)      => API.post('/admin/qms/inspection-methods', d);
export const updateInspectionMethod = (id, d)  => API.put(`/admin/qms/inspection-methods/${id}`, d);
export const deleteInspectionMethod = (id)     => API.delete(`/admin/qms/inspection-methods/${id}`);

// ── Inspection Lots ───────────────────────────────────────────────────────────
export const getInspectionLots   = (p = {}) => API.get('/admin/qms/inspection-lots', { params: p });
export const createInspectionLot = (d)      => API.post('/admin/qms/inspection-lots', d);
export const getInspectionLot    = (id)     => API.get(`/admin/qms/inspection-lots/${id}`);
export const updateInspectionLot = (id, d)  => API.put(`/admin/qms/inspection-lots/${id}`, d);
export const deleteInspectionLot = (id)     => API.delete(`/admin/qms/inspection-lots/${id}`);

// Inspection Results
export const createInspectionResult = (d)     => API.post('/admin/qms/inspection-results', d);
export const updateInspectionResult = (id, d) => API.put(`/admin/qms/inspection-results/${id}`, d);
export const deleteInspectionResult = (id)    => API.delete(`/admin/qms/inspection-results/${id}`);

// ── Quality Certificates ──────────────────────────────────────────────────────
export const getCertificates   = (p = {}) => API.get('/admin/qms/certificates', { params: p });
export const createCertificate = (d)      => API.post('/admin/qms/certificates', d);
export const getCertificate    = (id)     => API.get(`/admin/qms/certificates/${id}`);
export const updateCertificate = (id, d)  => API.put(`/admin/qms/certificates/${id}`, d);
export const deleteCertificate = (id)     => API.delete(`/admin/qms/certificates/${id}`);
export const issueCertificate  = (id)     => API.patch(`/admin/qms/certificates/${id}/issue`);
export const revokeCertificate = (id, d)  => API.patch(`/admin/qms/certificates/${id}/revoke`, d);

// ── CAPA ──────────────────────────────────────────────────────────────────────
export const getCAPAs   = (p = {}) => API.get('/admin/qms/capas', { params: p });
export const createCAPA = (d)      => API.post('/admin/qms/capas', d);
export const getCAPA    = (id)     => API.get(`/admin/qms/capas/${id}`);
export const updateCAPA = (id, d)  => API.put(`/admin/qms/capas/${id}`, d);
export const deleteCAPA = (id)     => API.delete(`/admin/qms/capas/${id}`);

// NC Reports
export const getNCReports   = (p = {}) => API.get('/admin/qms/nc-reports', { params: p });
export const createNCReport = (d)      => API.post('/admin/qms/nc-reports', d);
export const getNCReport    = (id)     => API.get(`/admin/qms/nc-reports/${id}`);
export const updateNCReport = (id, d)  => API.put(`/admin/qms/nc-reports/${id}`, d);
export const deleteNCReport = (id)     => API.delete(`/admin/qms/nc-reports/${id}`);

// RCA
export const getRCAs   = (p = {}) => API.get('/admin/qms/rca', { params: p });
export const createRCA = (d)      => API.post('/admin/qms/rca', d);
export const updateRCA = (id, d)  => API.put(`/admin/qms/rca/${id}`, d);

// Corrective Actions
export const getCorrectiveActions   = (p = {}) => API.get('/admin/qms/corrective-actions', { params: p });
export const createCorrectiveAction = (d)      => API.post('/admin/qms/corrective-actions', d);
export const updateCorrectiveAction = (id, d)  => API.put(`/admin/qms/corrective-actions/${id}`, d);

// Preventive Actions
export const getPreventiveActions   = (p = {}) => API.get('/admin/qms/preventive-actions', { params: p });
export const createPreventiveAction = (d)      => API.post('/admin/qms/preventive-actions', d);
export const updatePreventiveAction = (id, d)  => API.put(`/admin/qms/preventive-actions/${id}`, d);

// ── Audit Programs ────────────────────────────────────────────────────────────
export const getAuditPrograms   = (p = {}) => API.get('/admin/qms/audit-programs', { params: p });
export const createAuditProgram = (d)      => API.post('/admin/qms/audit-programs', d);
export const getAuditProgram    = (id)     => API.get(`/admin/qms/audit-programs/${id}`);
export const updateAuditProgram = (id, d)  => API.put(`/admin/qms/audit-programs/${id}`, d);
export const deleteAuditProgram = (id)     => API.delete(`/admin/qms/audit-programs/${id}`);

// Quality Audits
export const getQualityAudits   = (p = {}) => API.get('/admin/qms/audits', { params: p });
export const createQualityAudit = (d)      => API.post('/admin/qms/audits', d);
export const getQualityAudit    = (id)     => API.get(`/admin/qms/audits/${id}`);
export const updateQualityAudit = (id, d)  => API.put(`/admin/qms/audits/${id}`, d);
export const deleteQualityAudit = (id)     => API.delete(`/admin/qms/audits/${id}`);

// Audit Findings
export const getAuditFindings   = (p = {}) => API.get('/admin/qms/audit-findings', { params: p });
export const createAuditFinding = (d)      => API.post('/admin/qms/audit-findings', d);
export const updateAuditFinding = (id, d)  => API.put(`/admin/qms/audit-findings/${id}`, d);
export const deleteAuditFinding = (id)     => API.delete(`/admin/qms/audit-findings/${id}`);

// ── Gauges ────────────────────────────────────────────────────────────────────
export const getGauges   = (p = {}) => API.get('/admin/qms/gauges', { params: p });
export const createGauge = (d)      => API.post('/admin/qms/gauges', d);
export const getGauge    = (id)     => API.get(`/admin/qms/gauges/${id}`);
export const updateGauge = (id, d)  => API.put(`/admin/qms/gauges/${id}`, d);
export const deleteGauge = (id)     => API.delete(`/admin/qms/gauges/${id}`);
export const getGaugeHistory = (gaugeId, p = {}) => API.get(`/admin/qms/gauges/${gaugeId}/history`, { params: p });

// Calibration Records
export const getCalibrationRecords   = (p = {}) => API.get('/admin/qms/calibration-records', { params: p });
export const createCalibrationRecord = (d)      => API.post('/admin/qms/calibration-records', d);
export const getCalibrationRecord    = (id)     => API.get(`/admin/qms/calibration-records/${id}`);

// Calibration Schedules
export const getCalibrationSchedules   = (p = {}) => API.get('/admin/qms/calibration-schedules', { params: p });
export const createCalibrationSchedule = (d)      => API.post('/admin/qms/calibration-schedules', d);
export const updateCalibrationSchedule = (id, d)  => API.put(`/admin/qms/calibration-schedules/${id}`, d);

// ── Supplier Quality ──────────────────────────────────────────────────────────
export const getSupplierQualityRecords   = (p = {}) => API.get('/admin/qms/supplier-quality', { params: p });
export const createSupplierQualityRecord = (d)      => API.post('/admin/qms/supplier-quality', d);
export const getSupplierQualityRecord    = (id)     => API.get(`/admin/qms/supplier-quality/${id}`);
export const updateSupplierQualityRecord = (id, d)  => API.put(`/admin/qms/supplier-quality/${id}`, d);
export const deleteSupplierQualityRecord = (id)     => API.delete(`/admin/qms/supplier-quality/${id}`);
export const getSupplierScorecard        = (vendorId) => API.get(`/admin/qms/supplier-quality/scorecard/${vendorId}`);

// Quality Alerts
export const getQualityAlerts   = (p = {}) => API.get('/admin/qms/quality-alerts', { params: p });
export const createQualityAlert = (d)      => API.post('/admin/qms/quality-alerts', d);
export const updateQualityAlert = (id, d)  => API.put(`/admin/qms/quality-alerts/${id}`, d);
export const acknowledgeAlert   = (id)     => API.patch(`/admin/qms/quality-alerts/${id}/acknowledge`);
export const resolveAlert       = (id, d)  => API.patch(`/admin/qms/quality-alerts/${id}/resolve`, d);

// ── Document Control ──────────────────────────────────────────────────────────
export const getDocuments   = (p = {}) => API.get('/admin/qms/documents', { params: p });
export const createDocument = (d)      => API.post('/admin/qms/documents', d);
export const getDocument    = (id)     => API.get(`/admin/qms/documents/${id}`);
export const updateDocument = (id, d)  => API.put(`/admin/qms/documents/${id}`, d);
export const deleteDocument = (id)     => API.delete(`/admin/qms/documents/${id}`);
export const approveDocument  = (id)   => API.patch(`/admin/qms/documents/${id}/approve`);
export const activateDocument = (id, d) => API.patch(`/admin/qms/documents/${id}/activate`, d);
export const obsoleteDocument = (id)   => API.patch(`/admin/qms/documents/${id}/obsolete`);
export const getRevisions     = (docId)    => API.get(`/admin/qms/documents/${docId}/revisions`);
export const createRevision   = (docId, d) => API.post(`/admin/qms/documents/${docId}/revisions`, d);
