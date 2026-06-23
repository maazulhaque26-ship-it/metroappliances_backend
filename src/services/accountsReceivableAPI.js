import axios from 'axios';

const BASE = '/api/admin/accounts-receivable';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchARDashboard        = ()         => axios.get(`${BASE}/dashboard`);
export const fetchARAgingSummary     = ()         => axios.get(`${BASE}/dashboard/aging-summary`);
export const fetchTopCustomers       = (limit=10) => axios.get(`${BASE}/dashboard/top-customers`, { params: { limit } });
export const fetchCreditExposure     = ()         => axios.get(`${BASE}/dashboard/credit-exposure`);

// ── Customer Invoices ─────────────────────────────────────────────────────────
export const fetchInvoices           = (params)   => axios.get(`${BASE}/invoices`, { params });
export const fetchInvoice            = (id)       => axios.get(`${BASE}/invoices/${id}`);
export const createInvoice           = (data)     => axios.post(`${BASE}/invoices`, data);
export const updateInvoice           = (id, data) => axios.put(`${BASE}/invoices/${id}`, data);
export const deleteInvoice           = (id)       => axios.delete(`${BASE}/invoices/${id}`);
export const submitInvoice           = (id)       => axios.post(`${BASE}/invoices/${id}/submit`);
export const approveInvoice          = (id)       => axios.post(`${BASE}/invoices/${id}/approve`);
export const rejectInvoice           = (id, data) => axios.post(`${BASE}/invoices/${id}/reject`, data);
export const postInvoiceToGL         = (id, data) => axios.post(`${BASE}/invoices/${id}/post-gl`, data);

// ── Customer Receipts ─────────────────────────────────────────────────────────
export const fetchReceipts           = (params)   => axios.get(`${BASE}/receipts`, { params });
export const fetchReceipt            = (id)       => axios.get(`${BASE}/receipts/${id}`);
export const createReceipt           = (data)     => axios.post(`${BASE}/receipts`, data);
export const updateReceipt           = (id, data) => axios.put(`${BASE}/receipts/${id}`, data);
export const deleteReceipt           = (id)       => axios.delete(`${BASE}/receipts/${id}`);
export const postReceipt             = (id, data) => axios.post(`${BASE}/receipts/${id}/post`, data);
export const reverseReceipt          = (id, data) => axios.post(`${BASE}/receipts/${id}/reverse`, data);
export const allocateReceipt         = (id, data) => axios.post(`${BASE}/receipts/${id}/allocate`, data);
export const fetchReceiptAllocations = (params)   => axios.get(`${BASE}/receipts/allocations`, { params });

// ── Customer Advances ─────────────────────────────────────────────────────────
export const fetchAdvances           = (params)   => axios.get(`${BASE}/advances`, { params });
export const fetchAdvance            = (id)       => axios.get(`${BASE}/advances/${id}`);
export const createAdvance           = (data)     => axios.post(`${BASE}/advances`, data);

// ── Customer Ledger ───────────────────────────────────────────────────────────
export const fetchLedger             = (params)   => axios.get(`${BASE}/ledger`, { params });
export const fetchLedgerEntry        = (id)       => axios.get(`${BASE}/ledger/${id}`);
export const fetchAccountStatement   = (params)   => axios.get(`${BASE}/ledger/statement`, { params });

// ── Customer Statements ───────────────────────────────────────────────────────
export const fetchStatements         = (params)   => axios.get(`${BASE}/statements`, { params });
export const fetchStatement          = (id)       => axios.get(`${BASE}/statements/${id}`);
export const generateStatement       = (data)     => axios.post(`${BASE}/statements/generate`, data);
export const deleteStatement         = (id)       => axios.delete(`${BASE}/statements/${id}`);

// ── Customer Aging ────────────────────────────────────────────────────────────
export const fetchAgingReport        = (params)   => axios.get(`${BASE}/aging/report`, { params });
export const saveAgingSnapshot       = (data)     => axios.post(`${BASE}/aging/snapshot`, data);
export const fetchAgingSnapshots     = (params)   => axios.get(`${BASE}/aging/snapshots`, { params });
export const fetchAgingSnapshot      = (id)       => axios.get(`${BASE}/aging/snapshots/${id}`);

// ── Collection Activities ─────────────────────────────────────────────────────
export const fetchActivities         = (params)   => axios.get(`${BASE}/collections/activities`, { params });
export const fetchActivity           = (id)       => axios.get(`${BASE}/collections/activities/${id}`);
export const createActivity          = (data)     => axios.post(`${BASE}/collections/activities`, data);
export const updateActivity          = (id, data) => axios.put(`${BASE}/collections/activities/${id}`, data);
export const deleteActivity          = (id)       => axios.delete(`${BASE}/collections/activities/${id}`);

// ── Collection Reminders ──────────────────────────────────────────────────────
export const fetchReminders          = (params)   => axios.get(`${BASE}/collections/reminders`, { params });
export const createReminder          = (data)     => axios.post(`${BASE}/collections/reminders`, data);
export const sendReminder            = (id)       => axios.post(`${BASE}/collections/reminders/${id}/send`);
export const deleteReminder          = (id)       => axios.delete(`${BASE}/collections/reminders/${id}`);

// ── Promise To Pay ────────────────────────────────────────────────────────────
export const fetchPromises           = (params)   => axios.get(`${BASE}/collections/promises`, { params });
export const createPromise           = (data)     => axios.post(`${BASE}/collections/promises`, data);
export const updatePromise           = (id, data) => axios.put(`${BASE}/collections/promises/${id}`, data);

// ── Write-Offs ────────────────────────────────────────────────────────────────
export const fetchWriteOffs          = (params)   => axios.get(`${BASE}/write-offs`, { params });
export const createWriteOff          = (data)     => axios.post(`${BASE}/write-offs`, data);
export const approveWriteOff         = (id)       => axios.post(`${BASE}/write-offs/${id}/approve`);
export const postWriteOffToGL        = (id, data) => axios.post(`${BASE}/write-offs/${id}/post-gl`, data);

// ── Bad Debt ──────────────────────────────────────────────────────────────────
export const fetchBadDebts           = (params)   => axios.get(`${BASE}/bad-debts`, { params });
export const createBadDebt           = (data)     => axios.post(`${BASE}/bad-debts`, data);
export const approveBadDebt          = (id)       => axios.post(`${BASE}/bad-debts/${id}/approve`);
export const postBadDebtToGL         = (id, data) => axios.post(`${BASE}/bad-debts/${id}/post-gl`, data);

// ── Credit Limits ─────────────────────────────────────────────────────────────
export const fetchCreditLimits       = (params)   => axios.get(`${BASE}/credit/limits`, { params });
export const fetchCreditLimit        = (id)       => axios.get(`${BASE}/credit/limits/${id}`);
export const fetchCreditLimitByCustomer = (cid)  => axios.get(`${BASE}/credit/limits/customer/${cid}`);
export const createCreditLimit       = (data)     => axios.post(`${BASE}/credit/limits`, data);
export const updateCreditLimit       = (id, data) => axios.put(`${BASE}/credit/limits/${id}`, data);
export const deleteCreditLimit       = (id)       => axios.delete(`${BASE}/credit/limits/${id}`);
export const blockCustomerCredit     = (id, data) => axios.post(`${BASE}/credit/limits/${id}/block`, data);
export const unblockCustomerCredit   = (id, data) => axios.post(`${BASE}/credit/limits/${id}/unblock`, data);

// ── Credit Reviews ────────────────────────────────────────────────────────────
export const fetchCreditReviews      = (params)   => axios.get(`${BASE}/credit/reviews`, { params });
export const createCreditReview      = (data)     => axios.post(`${BASE}/credit/reviews`, data);
export const approveCreditReview     = (id, data) => axios.post(`${BASE}/credit/reviews/${id}/approve`, data);
export const rejectCreditReview      = (id, data) => axios.post(`${BASE}/credit/reviews/${id}/reject`, data);

// ── Receipt Batches ───────────────────────────────────────────────────────────
export const fetchReceiptBatches     = (params)   => axios.get(`${BASE}/receipt-batches`, { params });
export const fetchReceiptBatch       = (id)       => axios.get(`${BASE}/receipt-batches/${id}`);
export const createReceiptBatch      = (data)     => axios.post(`${BASE}/receipt-batches`, data);
export const updateReceiptBatch      = (id, data) => axios.put(`${BASE}/receipt-batches/${id}`, data);

// ── Receipt Vouchers ──────────────────────────────────────────────────────────
export const fetchReceiptVouchers    = (params)   => axios.get(`${BASE}/receipt-vouchers`, { params });
export const fetchReceiptVoucher     = (id)       => axios.get(`${BASE}/receipt-vouchers/${id}`);
export const createReceiptVoucher    = (data)     => axios.post(`${BASE}/receipt-vouchers`, data);

// ── Sales Register ────────────────────────────────────────────────────────────
export const fetchSalesRegister      = (params)   => axios.get(`${BASE}/sales-register`, { params });

// ── Receipt Register ──────────────────────────────────────────────────────────
export const fetchReceiptRegister    = (params)   => axios.get(`${BASE}/receipt-register`, { params });

// ── AR Settings ───────────────────────────────────────────────────────────────
export const fetchARSettings         = ()         => axios.get(`${BASE}/settings`);
export const updateARSetting         = (key, data)=> axios.put(`${BASE}/settings/${key}`, data);

// ── Collection Rules ──────────────────────────────────────────────────────────
export const fetchCollectionRules    = ()         => axios.get(`${BASE}/collection-rules`);
export const createCollectionRule    = (data)     => axios.post(`${BASE}/collection-rules`, data);
export const updateCollectionRule    = (id, data) => axios.put(`${BASE}/collection-rules/${id}`, data);
export const deleteCollectionRule    = (id)       => axios.delete(`${BASE}/collection-rules/${id}`);
