import axios from 'axios';
const BASE = '/api/admin/tax';

// ── Tax Dashboard ─────────────────────────────────────────────────────────────
export const fetchTaxDashboard       = ()       => axios.get(`${BASE}/dashboard`);
export const fetchComplianceStatus   = ()       => axios.get(`${BASE}/compliance-status`);

// ── Tax Codes ─────────────────────────────────────────────────────────────────
export const fetchTaxCodes           = (params) => axios.get(`${BASE}/codes`, { params });
export const createTaxCode           = (data)   => axios.post(`${BASE}/codes`, data);
export const updateTaxCode           = (id, d)  => axios.put(`${BASE}/codes/${id}`, d);
export const deleteTaxCode           = (id)     => axios.delete(`${BASE}/codes/${id}`);

// ── Tax Rates ─────────────────────────────────────────────────────────────────
export const fetchTaxRates           = (params) => axios.get(`${BASE}/rates`, { params });
export const createTaxRate           = (data)   => axios.post(`${BASE}/rates`, data);
export const updateTaxRate           = (id, d)  => axios.put(`${BASE}/rates/${id}`, d);

// ── Tax Groups ────────────────────────────────────────────────────────────────
export const fetchTaxGroups          = ()       => axios.get(`${BASE}/groups`);
export const createTaxGroup          = (data)   => axios.post(`${BASE}/groups`, data);
export const updateTaxGroup          = (id, d)  => axios.put(`${BASE}/groups/${id}`, d);

// ── Tax Jurisdictions ─────────────────────────────────────────────────────────
export const fetchJurisdictions      = ()       => axios.get(`${BASE}/jurisdictions`);
export const createJurisdiction      = (data)   => axios.post(`${BASE}/jurisdictions`, data);
export const updateJurisdiction      = (id, d)  => axios.put(`${BASE}/jurisdictions/${id}`, d);

// ── Tax Rules ─────────────────────────────────────────────────────────────────
export const fetchTaxRules           = (params) => axios.get(`${BASE}/rules`, { params });
export const createTaxRule           = (data)   => axios.post(`${BASE}/rules`, data);
export const updateTaxRule           = (id, d)  => axios.put(`${BASE}/rules/${id}`, d);

// ── Tax Exemptions ────────────────────────────────────────────────────────────
export const fetchTaxExemptions      = (params) => axios.get(`${BASE}/exemptions`, { params });
export const createTaxExemption      = (data)   => axios.post(`${BASE}/exemptions`, data);
export const updateTaxExemption      = (id, d)  => axios.put(`${BASE}/exemptions/${id}`, d);
export const deleteTaxExemption      = (id)     => axios.delete(`${BASE}/exemptions/${id}`);

// ── Tax Configuration ─────────────────────────────────────────────────────────
export const fetchTaxConfig          = (params) => axios.get(`${BASE}/configuration`, { params });
export const updateTaxConfig         = (key, d) => axios.put(`${BASE}/configuration/${key}`, d);

// ── GST Registrations ─────────────────────────────────────────────────────────
export const fetchGSTRegistrations   = (params) => axios.get(`${BASE}/gst/registrations`, { params });
export const createGSTRegistration   = (data)   => axios.post(`${BASE}/gst/registrations`, data);
export const updateGSTRegistration   = (id, d)  => axios.put(`${BASE}/gst/registrations/${id}`, d);
export const deleteGSTRegistration   = (id)     => axios.delete(`${BASE}/gst/registrations/${id}`);

// ── GST Returns ───────────────────────────────────────────────────────────────
export const fetchGSTReturns         = (params) => axios.get(`${BASE}/gst/returns`, { params });
export const fetchGSTReturn          = (id)     => axios.get(`${BASE}/gst/returns/${id}`);
export const createGSTReturn         = (data)   => axios.post(`${BASE}/gst/returns`, data);
export const updateGSTReturn         = (id, d)  => axios.put(`${BASE}/gst/returns/${id}`, d);
export const fileGSTReturn           = (id, d)  => axios.post(`${BASE}/gst/returns/${id}/file`, d);
export const deleteGSTReturn         = (id)     => axios.delete(`${BASE}/gst/returns/${id}`);

// ── GST Invoices ──────────────────────────────────────────────────────────────
export const fetchGSTInvoices        = (params) => axios.get(`${BASE}/gst/invoices`, { params });
export const createGSTInvoice        = (data)   => axios.post(`${BASE}/gst/invoices`, data);
export const updateGSTInvoice        = (id, d)  => axios.put(`${BASE}/gst/invoices/${id}`, d);

// ── GST Adjustments ───────────────────────────────────────────────────────────
export const fetchGSTAdjustments     = (params) => axios.get(`${BASE}/gst/adjustments`, { params });
export const createGSTAdjustment     = (data)   => axios.post(`${BASE}/gst/adjustments`, data);
export const approveGSTAdjustment    = (id)     => axios.post(`${BASE}/gst/adjustments/${id}/approve`);

// ── ITC Ledger ────────────────────────────────────────────────────────────────
export const fetchITCLedger          = (params) => axios.get(`${BASE}/gst/itc-ledger`, { params });
export const createITCEntry          = (data)   => axios.post(`${BASE}/gst/itc-ledger`, data);
export const fetchITCRegister        = (params) => axios.get(`${BASE}/gst/itc-register`, { params });

// ── Output Tax Ledger ─────────────────────────────────────────────────────────
export const fetchOutputTaxLedger    = (params) => axios.get(`${BASE}/gst/output-tax-ledger`, { params });
export const createOutputTaxEntry    = (data)   => axios.post(`${BASE}/gst/output-tax-ledger`, data);

// ── GST Settlements ───────────────────────────────────────────────────────────
export const fetchGSTSettlements     = (params) => axios.get(`${BASE}/gst/settlements`, { params });
export const fetchGSTSettlement      = (id)     => axios.get(`${BASE}/gst/settlements/${id}`);
export const createGSTSettlement     = (data)   => axios.post(`${BASE}/gst/settlements`, data);
export const settleGST               = (id, d)  => axios.post(`${BASE}/gst/settlements/${id}/settle`, d);

// ── TDS Sections ──────────────────────────────────────────────────────────────
export const fetchTDSSections        = (params) => axios.get(`${BASE}/tds/sections`, { params });
export const createTDSSection        = (data)   => axios.post(`${BASE}/tds/sections`, data);
export const updateTDSSection        = (id, d)  => axios.put(`${BASE}/tds/sections/${id}`, d);

// ── TDS Rates ─────────────────────────────────────────────────────────────────
export const fetchTDSRates           = (params) => axios.get(`${BASE}/tds/rates`, { params });
export const createTDSRate           = (data)   => axios.post(`${BASE}/tds/rates`, data);

// ── TDS Deductions ────────────────────────────────────────────────────────────
export const fetchTDSDeductions      = (params) => axios.get(`${BASE}/tds/deductions`, { params });
export const fetchTDSDeduction       = (id)     => axios.get(`${BASE}/tds/deductions/${id}`);
export const createTDSDeduction      = (data)   => axios.post(`${BASE}/tds/deductions`, data);
export const updateTDSDeduction      = (id, d)  => axios.put(`${BASE}/tds/deductions/${id}`, d);
export const deleteTDSDeduction      = (id)     => axios.delete(`${BASE}/tds/deductions/${id}`);

// ── TDS Deposits ──────────────────────────────────────────────────────────────
export const fetchTDSDeposits        = (params) => axios.get(`${BASE}/tds/deposits`, { params });
export const createTDSDeposit        = (data)   => axios.post(`${BASE}/tds/deposits`, data);
export const acknowledgeTDSDeposit   = (id, d)  => axios.post(`${BASE}/tds/deposits/${id}/acknowledge`, d);

// ── TDS Certificates ──────────────────────────────────────────────────────────
export const fetchTDSCertificates    = (params) => axios.get(`${BASE}/tds/certificates`, { params });
export const createTDSCertificate    = (data)   => axios.post(`${BASE}/tds/certificates`, data);
export const issueTDSCertificate     = (id)     => axios.post(`${BASE}/tds/certificates/${id}/issue`);
export const deleteTDSCertificate    = (id)     => axios.delete(`${BASE}/tds/certificates/${id}`);

// ── Compliance Calendar ───────────────────────────────────────────────────────
export const fetchComplianceCalendars  = (params) => axios.get(`${BASE}/compliance/calendars`, { params });
export const createComplianceCalendar  = (data)   => axios.post(`${BASE}/compliance/calendars`, data);
export const updateComplianceCalendar  = (id, d)  => axios.put(`${BASE}/compliance/calendars/${id}`, d);
export const deleteComplianceCalendar  = (id)     => axios.delete(`${BASE}/compliance/calendars/${id}`);

// ── Compliance Tasks ──────────────────────────────────────────────────────────
export const fetchComplianceTasks      = (params) => axios.get(`${BASE}/compliance/tasks`, { params });
export const fetchComplianceTask       = (id)     => axios.get(`${BASE}/compliance/tasks/${id}`);
export const createComplianceTask      = (data)   => axios.post(`${BASE}/compliance/tasks`, data);
export const updateComplianceTask      = (id, d)  => axios.put(`${BASE}/compliance/tasks/${id}`, d);
export const completeComplianceTask    = (id, d)  => axios.post(`${BASE}/compliance/tasks/${id}/complete`, d);
export const deleteComplianceTask      = (id)     => axios.delete(`${BASE}/compliance/tasks/${id}`);
export const fetchComplianceReminders  = (params) => axios.get(`${BASE}/compliance/tasks/reminders`, { params });

// ── Tax Audits ────────────────────────────────────────────────────────────────
export const fetchTaxAudits            = (params) => axios.get(`${BASE}/compliance/audits`, { params });
export const createTaxAudit            = (data)   => axios.post(`${BASE}/compliance/audits`, data);
export const updateTaxAudit            = (id, d)  => axios.put(`${BASE}/compliance/audits/${id}`, d);

// ── E-Invoice ─────────────────────────────────────────────────────────────────
export const fetchEInvoices            = (params) => axios.get(`${BASE}/einvoice`, { params });
export const fetchEInvoice             = (id)     => axios.get(`${BASE}/einvoice/${id}`);
export const createEInvoice            = (data)   => axios.post(`${BASE}/einvoice`, data);
export const generateIRN               = (id, d)  => axios.post(`${BASE}/einvoice/${id}/generate-irn`, d || {});
export const cancelEInvoice            = (id, d)  => axios.post(`${BASE}/einvoice/${id}/cancel`, d);
export const deleteEInvoice            = (id)     => axios.delete(`${BASE}/einvoice/${id}`);

// ── E-Way Bill ────────────────────────────────────────────────────────────────
export const fetchEWayBills            = (params) => axios.get(`${BASE}/ewaybill`, { params });
export const fetchEWayBill             = (id)     => axios.get(`${BASE}/ewaybill/${id}`);
export const createEWayBill            = (data)   => axios.post(`${BASE}/ewaybill`, data);
export const generateEWB               = (id, d)  => axios.post(`${BASE}/ewaybill/${id}/generate`, d || {});
export const updateEWBTransport        = (id, d)  => axios.put(`${BASE}/ewaybill/${id}/transport`, d);
export const cancelEWayBill            = (id, d)  => axios.post(`${BASE}/ewaybill/${id}/cancel`, d);
export const deleteEWayBill            = (id)     => axios.delete(`${BASE}/ewaybill/${id}`);

// ── Tax Reports ───────────────────────────────────────────────────────────────
export const fetchGSTR1Summary         = (params) => axios.get(`${BASE}/reports/gstr1`, { params });
export const fetchGSTR3BSummary        = (params) => axios.get(`${BASE}/reports/gstr3b`, { params });
export const fetchITCReport            = (params) => axios.get(`${BASE}/reports/itc-register`, { params });
export const fetchTDSRegister          = (params) => axios.get(`${BASE}/reports/tds-register`, { params });
export const fetchGSTSettlementReport  = (params) => axios.get(`${BASE}/reports/gst-settlement`, { params });
export const fetchTaxAuditReport       = (params) => axios.get(`${BASE}/reports/tax-audit`, { params });
export const fetchComplianceSummary    = (params) => axios.get(`${BASE}/reports/compliance-summary`, { params });
