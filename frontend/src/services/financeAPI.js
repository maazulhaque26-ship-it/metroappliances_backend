import axios from 'axios';

// Dashboard
export const fetchFinanceDashboard        = ()       => axios.get('/api/admin/finance/dashboard');
export const fetchAccountTypeBreakdown    = ()       => axios.get('/api/admin/finance/dashboard/account-breakdown');
export const fetchTopAccounts             = (params) => axios.get('/api/admin/finance/dashboard/top-accounts', { params });

// Chart of Accounts
export const fetchAccountTree             = ()       => axios.get('/api/admin/finance/accounts/tree');
export const fetchAccounts                = (params) => axios.get('/api/admin/finance/accounts', { params });
export const fetchAccount                 = (id)     => axios.get(`/api/admin/finance/accounts/${id}`);
export const createAccount                = (data)   => axios.post('/api/admin/finance/accounts', data);
export const updateAccount                = (id, d)  => axios.put(`/api/admin/finance/accounts/${id}`, d);
export const deleteAccount                = (id)     => axios.delete(`/api/admin/finance/accounts/${id}`);

// Account Groups
export const fetchAccountGroups           = (params) => axios.get('/api/admin/finance/account-groups', { params });
export const createAccountGroup           = (data)   => axios.post('/api/admin/finance/account-groups', data);
export const updateAccountGroup           = (id, d)  => axios.put(`/api/admin/finance/account-groups/${id}`, d);
export const deleteAccountGroup           = (id)     => axios.delete(`/api/admin/finance/account-groups/${id}`);

// Journal Entries
export const fetchJournals                = (params) => axios.get('/api/admin/finance/journals', { params });
export const fetchJournal                 = (id)     => axios.get(`/api/admin/finance/journals/${id}`);
export const createJournal                = (data)   => axios.post('/api/admin/finance/journals', data);
export const updateJournal                = (id, d)  => axios.put(`/api/admin/finance/journals/${id}`, d);
export const deleteJournal                = (id)     => axios.delete(`/api/admin/finance/journals/${id}`);
export const postJournal                  = (id)     => axios.patch(`/api/admin/finance/journals/${id}/post`);
export const reverseJournal               = (id, d)  => axios.post(`/api/admin/finance/journals/${id}/reverse`, d);

// General Ledger
export const fetchLedgerEntries           = (params) => axios.get('/api/admin/finance/ledger', { params });
export const fetchLedgerBalances          = (params) => axios.get('/api/admin/finance/ledger/balances', { params });
export const fetchAccountStatement        = (accountId, params) => axios.get(`/api/admin/finance/ledger/accounts/${accountId}/statement`, { params });

// Fiscal Years
export const fetchFiscalYears             = (params) => axios.get('/api/admin/finance/fiscal-years', { params });
export const fetchFiscalYear              = (id)     => axios.get(`/api/admin/finance/fiscal-years/${id}`);
export const createFiscalYear             = (data)   => axios.post('/api/admin/finance/fiscal-years', data);
export const updateFiscalYear             = (id, d)  => axios.put(`/api/admin/finance/fiscal-years/${id}`, d);
export const deleteFiscalYear             = (id)     => axios.delete(`/api/admin/finance/fiscal-years/${id}`);
export const closeFiscalYear              = (id)     => axios.patch(`/api/admin/finance/fiscal-years/${id}/close`);
export const lockFiscalYear               = (id)     => axios.patch(`/api/admin/finance/fiscal-years/${id}/lock`);

// Accounting Periods
export const fetchPeriods                 = (params) => axios.get('/api/admin/finance/periods', { params });
export const createPeriod                 = (data)   => axios.post('/api/admin/finance/periods', data);
export const updatePeriod                 = (id, d)  => axios.put(`/api/admin/finance/periods/${id}`, d);
export const closePeriod                  = (id)     => axios.patch(`/api/admin/finance/periods/${id}/close`);
export const lockPeriod                   = (id)     => axios.patch(`/api/admin/finance/periods/${id}/lock`);

// Posting Rules
export const fetchPostingRules            = (params) => axios.get('/api/admin/finance/posting-rules', { params });
export const createPostingRule            = (data)   => axios.post('/api/admin/finance/posting-rules', data);
export const updatePostingRule            = (id, d)  => axios.put(`/api/admin/finance/posting-rules/${id}`, d);
export const deletePostingRule            = (id)     => axios.delete(`/api/admin/finance/posting-rules/${id}`);

// Posting Templates
export const fetchPostingTemplates        = (params) => axios.get('/api/admin/finance/posting-templates', { params });
export const createPostingTemplate        = (data)   => axios.post('/api/admin/finance/posting-templates', data);
export const updatePostingTemplate        = (id, d)  => axios.put(`/api/admin/finance/posting-templates/${id}`, d);
export const deletePostingTemplate        = (id)     => axios.delete(`/api/admin/finance/posting-templates/${id}`);

// Voucher Series
export const fetchVoucherSeries           = (params) => axios.get('/api/admin/finance/voucher-series', { params });
export const createVoucherSeries          = (data)   => axios.post('/api/admin/finance/voucher-series', data);
export const updateVoucherSeries          = (id, d)  => axios.put(`/api/admin/finance/voucher-series/${id}`, d);

// Vouchers
export const fetchVouchers                = (params) => axios.get('/api/admin/finance/vouchers', { params });
export const fetchVoucher                 = (id)     => axios.get(`/api/admin/finance/vouchers/${id}`);
export const createVoucher                = (data)   => axios.post('/api/admin/finance/vouchers', data);
export const updateVoucher                = (id, d)  => axios.put(`/api/admin/finance/vouchers/${id}`, d);
export const deleteVoucher                = (id)     => axios.delete(`/api/admin/finance/vouchers/${id}`);

// Cost Centers
export const fetchCostCenters             = (params) => axios.get('/api/admin/finance/cost-centers', { params });
export const createCostCenter             = (data)   => axios.post('/api/admin/finance/cost-centers', data);
export const updateCostCenter             = (id, d)  => axios.put(`/api/admin/finance/cost-centers/${id}`, d);
export const deleteCostCenter             = (id)     => axios.delete(`/api/admin/finance/cost-centers/${id}`);

// Profit Centers
export const fetchProfitCenters           = (params) => axios.get('/api/admin/finance/profit-centers', { params });
export const createProfitCenter           = (data)   => axios.post('/api/admin/finance/profit-centers', data);
export const updateProfitCenter           = (id, d)  => axios.put(`/api/admin/finance/profit-centers/${id}`, d);
export const deleteProfitCenter           = (id)     => axios.delete(`/api/admin/finance/profit-centers/${id}`);

// Accounting Dimensions
export const fetchDimensions              = ()       => axios.get('/api/admin/finance/dimensions');
export const createDimension              = (data)   => axios.post('/api/admin/finance/dimensions', data);
export const updateDimension              = (id, d)  => axios.put(`/api/admin/finance/dimensions/${id}`, d);

// Reports
export const fetchTrialBalance            = (params) => axios.get('/api/admin/finance/reports/trial-balance', { params });
export const saveTrialBalanceSnapshot     = (data)   => axios.post('/api/admin/finance/reports/trial-balance/save', data);
export const fetchBalanceSheet            = (params) => axios.get('/api/admin/finance/reports/balance-sheet', { params });
export const fetchProfitAndLoss           = (params) => axios.get('/api/admin/finance/reports/profit-and-loss', { params });
export const fetchCashBook                = (params) => axios.get('/api/admin/finance/reports/cash-book', { params });
export const fetchBankBook                = (params) => axios.get('/api/admin/finance/reports/bank-book', { params });
export const fetchJournalBook             = (params) => axios.get('/api/admin/finance/reports/journal-book', { params });
export const fetchDayBook                 = (params) => axios.get('/api/admin/finance/reports/day-book', { params });

// Financial Settings
export const fetchFinancialSettings       = ()       => axios.get('/api/admin/finance/settings');
export const updateFinancialSettings      = (data)   => axios.put('/api/admin/finance/settings', data);

// Currencies
export const fetchCurrencies              = ()       => axios.get('/api/admin/finance/currencies');
export const createCurrency               = (data)   => axios.post('/api/admin/finance/currencies', data);
export const updateCurrency               = (id, d)  => axios.put(`/api/admin/finance/currencies/${id}`, d);
export const deleteCurrency               = (id)     => axios.delete(`/api/admin/finance/currencies/${id}`);

// Exchange Rates
export const fetchExchangeRates           = (params) => axios.get('/api/admin/finance/exchange-rates', { params });
export const createExchangeRate           = (data)   => axios.post('/api/admin/finance/exchange-rates', data);
export const updateExchangeRate           = (id, d)  => axios.put(`/api/admin/finance/exchange-rates/${id}`, d);

// Opening Balances
export const fetchOpeningBalances         = (params) => axios.get('/api/admin/finance/opening-balances', { params });
export const createOpeningBalance         = (data)   => axios.post('/api/admin/finance/opening-balances', data);
export const updateOpeningBalance         = (id, d)  => axios.put(`/api/admin/finance/opening-balances/${id}`, d);
