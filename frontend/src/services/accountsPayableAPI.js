import axios from 'axios';

const BASE = '/api/admin/accounts-payable';

// Dashboard
export const fetchAPDashboard          = ()       => axios.get(`${BASE}/dashboard`);
export const fetchAPAgingSummary       = ()       => axios.get(`${BASE}/dashboard/aging-summary`);
export const fetchAPTopVendors         = (params) => axios.get(`${BASE}/dashboard/top-vendors`, { params });
export const fetchGSTCreditSummary     = ()       => axios.get(`${BASE}/dashboard/gst-credit-summary`);

// Vendor Bills
export const fetchBills                = (params) => axios.get(`${BASE}/bills`, { params });
export const fetchBill                 = (id)     => axios.get(`${BASE}/bills/${id}`);
export const createBill                = (data)   => axios.post(`${BASE}/bills`, data);
export const updateBill                = (id, d)  => axios.put(`${BASE}/bills/${id}`, d);
export const deleteBill                = (id)     => axios.delete(`${BASE}/bills/${id}`);
export const submitBill                = (id)     => axios.post(`${BASE}/bills/${id}/submit`);
export const approveBill               = (id)     => axios.post(`${BASE}/bills/${id}/approve`);
export const rejectBill                = (id, d)  => axios.post(`${BASE}/bills/${id}/reject`, d);
export const postBillToGL              = (id, d)  => axios.post(`${BASE}/bills/${id}/post-gl`, d);

// Vendor Payments
export const fetchPayments             = (params) => axios.get(`${BASE}/payments`, { params });
export const fetchPayment              = (id)     => axios.get(`${BASE}/payments/${id}`);
export const createPayment             = (data)   => axios.post(`${BASE}/payments`, data);
export const updatePayment             = (id, d)  => axios.put(`${BASE}/payments/${id}`, d);
export const deletePayment             = (id)     => axios.delete(`${BASE}/payments/${id}`);
export const approvePayment            = (id)     => axios.post(`${BASE}/payments/${id}/approve`);
export const postPayment               = (id, d)  => axios.post(`${BASE}/payments/${id}/post`, d);
export const reversePayment            = (id, d)  => axios.post(`${BASE}/payments/${id}/reverse`, d);
export const fetchAllocations          = (params) => axios.get(`${BASE}/payments/allocations`, { params });

// Vendor Ledger
export const fetchVendorLedger         = (params) => axios.get(`${BASE}/ledger`, { params });
export const fetchLedgerStatement      = (params) => axios.get(`${BASE}/ledger/statement`, { params });

// Vendor Statements
export const fetchVendorStatements     = (params) => axios.get(`${BASE}/statements`, { params });
export const fetchVendorStatement      = (id)     => axios.get(`${BASE}/statements/${id}`);
export const generateStatement         = (data)   => axios.post(`${BASE}/statements/generate`, data);
export const deleteStatement           = (id)     => axios.delete(`${BASE}/statements/${id}`);

// Aging
export const fetchAgingReport          = (params) => axios.get(`${BASE}/aging/report`, { params });
export const saveAgingSnapshot         = (data)   => axios.post(`${BASE}/aging/snapshot`, data);
export const fetchAgingSnapshots       = (params) => axios.get(`${BASE}/aging/snapshots`, { params });
export const fetchAgingSnapshot        = (id)     => axios.get(`${BASE}/aging/snapshots/${id}`);

// Payment Runs
export const fetchPaymentRuns          = (params) => axios.get(`${BASE}/payment-runs`, { params });
export const fetchPaymentRun           = (id)     => axios.get(`${BASE}/payment-runs/${id}`);
export const createPaymentRun          = (data)   => axios.post(`${BASE}/payment-runs`, data);
export const proposePaymentRun         = (id)     => axios.post(`${BASE}/payment-runs/${id}/propose`);
export const approvePaymentRun         = (id)     => axios.post(`${BASE}/payment-runs/${id}/approve`);
export const executePaymentRun         = (id)     => axios.post(`${BASE}/payment-runs/${id}/execute`);
export const cancelPaymentRun          = (id)     => axios.post(`${BASE}/payment-runs/${id}/cancel`);
export const deletePaymentRun          = (id)     => axios.delete(`${BASE}/payment-runs/${id}`);

// Payment Batches
export const fetchPaymentBatches       = (params) => axios.get(`${BASE}/payment-batches`, { params });
export const fetchPaymentBatch         = (id)     => axios.get(`${BASE}/payment-batches/${id}`);

// Payment Advice
export const fetchPaymentAdvices       = (params) => axios.get(`${BASE}/payment-advices`, { params });
export const fetchPaymentAdvice        = (id)     => axios.get(`${BASE}/payment-advices/${id}`);
export const createPaymentAdvice       = (data)   => axios.post(`${BASE}/payment-advices`, data);

// Invoice Matching
export const fetchInvoiceMatches       = (params) => axios.get(`${BASE}/invoice-matches`, { params });
export const fetchInvoiceMatch         = (id)     => axios.get(`${BASE}/invoice-matches/${id}`);
export const performInvoiceMatch       = (data)   => axios.post(`${BASE}/invoice-matches/perform`, data);
export const resolveInvoiceMatch       = (id, d)  => axios.post(`${BASE}/invoice-matches/${id}/resolve`, d);
export const deleteInvoiceMatch        = (id)     => axios.delete(`${BASE}/invoice-matches/${id}`);

// Vendor Invoices
export const fetchVendorInvoices       = (params) => axios.get(`${BASE}/vendor-invoices`, { params });
export const fetchVendorInvoice        = (id)     => axios.get(`${BASE}/vendor-invoices/${id}`);
export const createVendorInvoice       = (data)   => axios.post(`${BASE}/vendor-invoices`, data);
export const updateVendorInvoice       = (id, d)  => axios.put(`${BASE}/vendor-invoices/${id}`, d);
export const convertInvoiceToBill      = (id)     => axios.post(`${BASE}/vendor-invoices/${id}/convert`);
export const deleteVendorInvoice       = (id)     => axios.delete(`${BASE}/vendor-invoices/${id}`);

// Debit Notes
export const fetchDebitNotes           = (params) => axios.get(`${BASE}/debit-notes`, { params });
export const fetchDebitNote            = (id)     => axios.get(`${BASE}/debit-notes/${id}`);
export const createDebitNote           = (data)   => axios.post(`${BASE}/debit-notes`, data);
export const updateDebitNote           = (id, d)  => axios.put(`${BASE}/debit-notes/${id}`, d);
export const deleteDebitNote           = (id)     => axios.delete(`${BASE}/debit-notes/${id}`);

// Credit Notes
export const fetchCreditNotes          = (params) => axios.get(`${BASE}/credit-notes`, { params });
export const fetchCreditNote           = (id)     => axios.get(`${BASE}/credit-notes/${id}`);
export const createCreditNote          = (data)   => axios.post(`${BASE}/credit-notes`, data);
export const updateCreditNote          = (id, d)  => axios.put(`${BASE}/credit-notes/${id}`, d);
export const deleteCreditNote          = (id)     => axios.delete(`${BASE}/credit-notes/${id}`);

// GST Input Credit
export const fetchGSTInputCredits      = (params) => axios.get(`${BASE}/gst-input-credit`, { params });
export const createGSTInputCredit      = (data)   => axios.post(`${BASE}/gst-input-credit`, data);
export const updateGSTInputCredit      = (id, d)  => axios.put(`${BASE}/gst-input-credit/${id}`, d);

// Payment Schedules
export const fetchPaymentSchedules     = (params) => axios.get(`${BASE}/payment-schedules`, { params });
export const fetchPaymentSchedule      = (id)     => axios.get(`${BASE}/payment-schedules/${id}`);
export const createPaymentSchedule     = (data)   => axios.post(`${BASE}/payment-schedules`, data);
export const updatePaymentSchedule     = (id, d)  => axios.put(`${BASE}/payment-schedules/${id}`, d);
export const deletePaymentSchedule     = (id)     => axios.delete(`${BASE}/payment-schedules/${id}`);

// Withholding Tax
export const fetchWithholdingTaxes     = ()       => axios.get(`${BASE}/withholding-taxes`);
export const createWithholdingTax      = (data)   => axios.post(`${BASE}/withholding-taxes`, data);
export const updateWithholdingTax      = (id, d)  => axios.put(`${BASE}/withholding-taxes/${id}`, d);
export const deleteWithholdingTax      = (id)     => axios.delete(`${BASE}/withholding-taxes/${id}`);

// Payment Terms
export const fetchPaymentTerms         = ()       => axios.get(`${BASE}/payment-terms`);
export const createPaymentTerm         = (data)   => axios.post(`${BASE}/payment-terms`, data);
export const updatePaymentTerm         = (id, d)  => axios.put(`${BASE}/payment-terms/${id}`, d);
export const deletePaymentTerm         = (id)     => axios.delete(`${BASE}/payment-terms/${id}`);

// Vendor Settlements
export const fetchSettlements          = (params) => axios.get(`${BASE}/settlements`, { params });
export const fetchSettlement           = (id)     => axios.get(`${BASE}/settlements/${id}`);
export const createSettlement          = (data)   => axios.post(`${BASE}/settlements`, data);

// Payment Approvals
export const fetchPaymentApprovals     = (params) => axios.get(`${BASE}/payment-approvals`, { params });
export const createPaymentApproval     = (data)   => axios.post(`${BASE}/payment-approvals`, data);
export const approvePaymentApproval    = (id, d)  => axios.post(`${BASE}/payment-approvals/${id}/approve`, d);
export const rejectPaymentApproval     = (id, d)  => axios.post(`${BASE}/payment-approvals/${id}/reject`, d);
