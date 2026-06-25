import axios from 'axios';
const BASE = '/api/admin/banking';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchBankingDashboard    = ()       => axios.get(`${BASE}/dashboard`);
export const fetchBankingCompliance   = ()       => axios.get(`${BASE}/compliance-status`);

// ── Banks ─────────────────────────────────────────────────────────────────────
export const fetchBanks               = (p)      => axios.get(`${BASE}/banks`, { params: p });
export const createBank               = (d)      => axios.post(`${BASE}/banks`, d);
export const updateBank               = (id, d)  => axios.put(`${BASE}/banks/${id}`, d);
export const deleteBank               = (id)     => axios.delete(`${BASE}/banks/${id}`);

// ── Bank Branches ─────────────────────────────────────────────────────────────
export const fetchBranches            = (p)      => axios.get(`${BASE}/branches`, { params: p });
export const createBranch             = (d)      => axios.post(`${BASE}/branches`, d);
export const updateBranch             = (id, d)  => axios.put(`${BASE}/branches/${id}`, d);
export const deleteBranch             = (id)     => axios.delete(`${BASE}/branches/${id}`);

// ── Bank Accounts ─────────────────────────────────────────────────────────────
export const fetchBankAccounts        = (p)      => axios.get(`${BASE}/accounts`, { params: p });
export const fetchBankAccount         = (id)     => axios.get(`${BASE}/accounts/${id}`);
export const createBankAccount        = (d)      => axios.post(`${BASE}/accounts`, d);
export const updateBankAccount        = (id, d)  => axios.put(`${BASE}/accounts/${id}`, d);

// ── Bank Transactions ─────────────────────────────────────────────────────────
export const fetchBankTransactions    = (p)      => axios.get(`${BASE}/transactions`, { params: p });
export const createBankTransaction    = (d)      => axios.post(`${BASE}/transactions`, d);
export const updateBankTransaction    = (id, d)  => axios.put(`${BASE}/transactions/${id}`, d);
export const deleteBankTransaction    = (id)     => axios.delete(`${BASE}/transactions/${id}`);

// ── Bank Statements ───────────────────────────────────────────────────────────
export const fetchBankStatements      = (p)      => axios.get(`${BASE}/statements`, { params: p });
export const createBankStatement      = (d)      => axios.post(`${BASE}/statements`, d);
export const fetchStatementLines      = (id, p)  => axios.get(`${BASE}/statements/${id}/lines`, { params: p });

// ── Bank Charges ──────────────────────────────────────────────────────────────
export const fetchBankCharges         = (p)      => axios.get(`${BASE}/charges`, { params: p });
export const createBankCharge         = (d)      => axios.post(`${BASE}/charges`, d);

// ── Interest Postings ─────────────────────────────────────────────────────────
export const fetchInterestPostings    = (p)      => axios.get(`${BASE}/interest-postings`, { params: p });
export const createInterestPosting    = (d)      => axios.post(`${BASE}/interest-postings`, d);

// ── Electronic Payments ───────────────────────────────────────────────────────
export const fetchElectronicPayments  = (p)      => axios.get(`${BASE}/electronic-payments`, { params: p });
export const createElectronicPayment  = (d)      => axios.post(`${BASE}/electronic-payments`, d);
export const updatePaymentStatus      = (id, d)  => axios.put(`${BASE}/electronic-payments/${id}/status`, d);

// ── Cheque Books ──────────────────────────────────────────────────────────────
export const fetchChequeBooks         = (p)      => axios.get(`${BASE}/cheque-books`, { params: p });
export const createChequeBook         = (d)      => axios.post(`${BASE}/cheque-books`, d);

// ── Cheques ───────────────────────────────────────────────────────────────────
export const fetchCheques             = (p)      => axios.get(`${BASE}/cheques`, { params: p });
export const createCheque             = (d)      => axios.post(`${BASE}/cheques`, d);
export const updateChequeStatus       = (id, d)  => axios.put(`${BASE}/cheques/${id}/status`, d);

// ── Reconciliation ────────────────────────────────────────────────────────────
export const fetchReconciliations     = (p)      => axios.get(`${BASE}/reconciliation`, { params: p });
export const createReconciliation     = (d)      => axios.post(`${BASE}/reconciliation`, d);
export const fetchReconciliation      = (id)     => axios.get(`${BASE}/reconciliation/${id}`);
export const autoMatchReconciliation  = (id)     => axios.post(`${BASE}/reconciliation/${id}/auto-match`);
export const manualMatchReconciliation= (id, d)  => axios.post(`${BASE}/reconciliation/${id}/manual-match`, d);
export const completeReconciliation   = (id, d)  => axios.post(`${BASE}/reconciliation/${id}/complete`, d);
export const deleteReconciliation     = (id)     => axios.delete(`${BASE}/reconciliation/${id}`);
export const fetchUnmatched           = (id)     => axios.get(`${BASE}/reconciliation/${id}/unmatched`);

// ── Cash Accounts ─────────────────────────────────────────────────────────────
export const fetchCashAccounts        = (p)      => axios.get(`${BASE}/cash-accounts`, { params: p });
export const createCashAccount        = (d)      => axios.post(`${BASE}/cash-accounts`, d);
export const updateCashAccount        = (id, d)  => axios.put(`${BASE}/cash-accounts/${id}`, d);

// ── Cash Transactions ─────────────────────────────────────────────────────────
export const fetchCashTransactions    = (p)      => axios.get(`${BASE}/cash-transactions`, { params: p });
export const createCashTransaction    = (d)      => axios.post(`${BASE}/cash-transactions`, d);

// ── Cash Transfers ────────────────────────────────────────────────────────────
export const fetchCashTransfers       = (p)      => axios.get(`${BASE}/cash-transfers`, { params: p });
export const createCashTransfer       = (d)      => axios.post(`${BASE}/cash-transfers`, d);
export const completeTransfer         = (id)     => axios.post(`${BASE}/cash-transfers/${id}/complete`);

// ── Petty Cash Funds ──────────────────────────────────────────────────────────
export const fetchPettyCashFunds      = (p)      => axios.get(`${BASE}/petty-cash`, { params: p });
export const createPettyCashFund      = (d)      => axios.post(`${BASE}/petty-cash`, d);
export const updatePettyCashFund      = (id, d)  => axios.put(`${BASE}/petty-cash/${id}`, d);
export const replenishFund            = (id, d)  => axios.post(`${BASE}/petty-cash/${id}/replenish`, d);

// ── Petty Cash Vouchers ───────────────────────────────────────────────────────
export const fetchPettyCashVouchers   = (p)      => axios.get(`${BASE}/petty-cash-vouchers`, { params: p });
export const createPettyCashVoucher   = (d)      => axios.post(`${BASE}/petty-cash-vouchers`, d);
export const approveVoucher           = (id)     => axios.post(`${BASE}/petty-cash-vouchers/${id}/approve`);

// ── Treasury Positions ────────────────────────────────────────────────────────
export const fetchTreasuryPositions   = (p)      => axios.get(`${BASE}/treasury-positions`, { params: p });
export const createTreasuryPosition   = (d)      => axios.post(`${BASE}/treasury-positions`, d);

// ── Cash Forecasts ────────────────────────────────────────────────────────────
export const fetchCashForecasts       = (p)      => axios.get(`${BASE}/cash-forecasts`, { params: p });
export const createCashForecast       = (d)      => axios.post(`${BASE}/cash-forecasts`, d);
export const updateCashForecast       = (id, d)  => axios.put(`${BASE}/cash-forecasts/${id}`, d);
export const deleteCashForecast       = (id)     => axios.delete(`${BASE}/cash-forecasts/${id}`);

// ── Liquidity Forecasts ───────────────────────────────────────────────────────
export const fetchLiquidityForecasts  = (p)      => axios.get(`${BASE}/liquidity-forecasts`, { params: p });
export const createLiquidityForecast  = (d)      => axios.post(`${BASE}/liquidity-forecasts`, d);

// ── Bank Guarantees ───────────────────────────────────────────────────────────
export const fetchBankGuarantees      = (p)      => axios.get(`${BASE}/bank-guarantees`, { params: p });
export const fetchBankGuarantee       = (id)     => axios.get(`${BASE}/bank-guarantees/${id}`);
export const createBankGuarantee      = (d)      => axios.post(`${BASE}/bank-guarantees`, d);
export const updateBankGuarantee      = (id, d)  => axios.put(`${BASE}/bank-guarantees/${id}`, d);
export const deleteBankGuarantee      = (id)     => axios.delete(`${BASE}/bank-guarantees/${id}`);

// ── Letters of Credit ─────────────────────────────────────────────────────────
export const fetchLettersOfCredit     = (p)      => axios.get(`${BASE}/letters-of-credit`, { params: p });
export const fetchLetterOfCredit      = (id)     => axios.get(`${BASE}/letters-of-credit/${id}`);
export const createLetterOfCredit     = (d)      => axios.post(`${BASE}/letters-of-credit`, d);
export const updateLetterOfCredit     = (id, d)  => axios.put(`${BASE}/letters-of-credit/${id}`, d);
export const deleteLetterOfCredit     = (id)     => axios.delete(`${BASE}/letters-of-credit/${id}`);

// ── Treasury Settings ─────────────────────────────────────────────────────────
export const fetchTreasurySettings    = ()       => axios.get(`${BASE}/settings`);
export const upsertTreasurySetting    = (key, d) => axios.put(`${BASE}/settings/${key}`, d);

// ── Payment Gateways ──────────────────────────────────────────────────────────
export const fetchGateways            = ()       => axios.get(`${BASE}/gateways`);
export const createGateway            = (d)      => axios.post(`${BASE}/gateways`, d);
export const updateGateway            = (id, d)  => axios.put(`${BASE}/gateways/${id}`, d);
export const fetchGatewayTransactions = (p)      => axios.get(`${BASE}/gateway-transactions`, { params: p });
export const createGatewayTransaction = (d)      => axios.post(`${BASE}/gateway-transactions`, d);

// ── Investments ───────────────────────────────────────────────────────────────
export const fetchInvestments         = (p)      => axios.get(`${BASE}/investments`, { params: p });
export const fetchInvestment          = (id)     => axios.get(`${BASE}/investments/${id}`);
export const createInvestment         = (d)      => axios.post(`${BASE}/investments`, d);
export const updateInvestment         = (id, d)  => axios.put(`${BASE}/investments/${id}`, d);
export const redeemInvestment         = (id, d)  => axios.post(`${BASE}/investments/${id}/redeem`, d);
export const deleteInvestment         = (id)     => axios.delete(`${BASE}/investments/${id}`);

// ── Fixed Deposits ────────────────────────────────────────────────────────────
export const fetchFixedDeposits       = (p)      => axios.get(`${BASE}/fixed-deposits`, { params: p });
export const fetchFixedDeposit        = (id)     => axios.get(`${BASE}/fixed-deposits/${id}`);
export const createFixedDeposit       = (d)      => axios.post(`${BASE}/fixed-deposits`, d);
export const updateFixedDeposit       = (id, d)  => axios.put(`${BASE}/fixed-deposits/${id}`, d);
export const closeFixedDeposit        = (id, d)  => axios.post(`${BASE}/fixed-deposits/${id}/close`, d);
export const deleteFixedDeposit       = (id)     => axios.delete(`${BASE}/fixed-deposits/${id}`);
export const fetchFDInterestPostings  = (id)     => axios.get(`${BASE}/fixed-deposits/${id}/interest`);

// ── FX Rates (reuse ExchangeRate model) ──────────────────────────────────────
export const fetchFXRates             = (p)      => axios.get(`${BASE}/fx/rates`, { params: p });
export const createFXRate             = (d)      => axios.post(`${BASE}/fx/rates`, d);
export const updateFXRate             = (id, d)  => axios.put(`${BASE}/fx/rates/${id}`, d);
export const deleteFXRate             = (id)     => axios.delete(`${BASE}/fx/rates/${id}`);

// ── FX Transactions ───────────────────────────────────────────────────────────
export const fetchFXTransactions      = (p)      => axios.get(`${BASE}/fx/transactions`, { params: p });
export const createFXTransaction      = (d)      => axios.post(`${BASE}/fx/transactions`, d);
export const updateFXTransaction      = (id, d)  => axios.put(`${BASE}/fx/transactions/${id}`, d);
export const settleFXTransaction      = (id, d)  => axios.post(`${BASE}/fx/transactions/${id}/settle`, d);
export const deleteFXTransaction      = (id)     => axios.delete(`${BASE}/fx/transactions/${id}`);

// ── FX Gain/Loss ──────────────────────────────────────────────────────────────
export const fetchFXGainLoss          = (p)      => axios.get(`${BASE}/fx/gain-loss`, { params: p });

// ── Currency Accounts ─────────────────────────────────────────────────────────
export const fetchCurrencyAccounts    = (p)      => axios.get(`${BASE}/currency-accounts`, { params: p });
export const createCurrencyAccount    = (d)      => axios.post(`${BASE}/currency-accounts`, d);
export const updateCurrencyAccount    = (id, d)  => axios.put(`${BASE}/currency-accounts/${id}`, d);
export const revalueCurrencyAccount   = (id, d)  => axios.post(`${BASE}/currency-accounts/${id}/revalue`, d);

// ── Banking Reports ───────────────────────────────────────────────────────────
export const fetchBankBook            = (p)      => axios.get(`${BASE}/reports/bank-book`, { params: p });
export const fetchCashBook            = (p)      => axios.get(`${BASE}/reports/cash-book`, { params: p });
export const fetchDailyCashPosition   = (p)      => axios.get(`${BASE}/reports/daily-cash`, { params: p });
export const fetchTreasuryPositionReport = (p)   => axios.get(`${BASE}/reports/treasury-position`, { params: p });
export const fetchInvestmentRegister  = (p)      => axios.get(`${BASE}/reports/investments`, { params: p });
export const fetchFDRegister          = (p)      => axios.get(`${BASE}/reports/fd-register`, { params: p });
export const fetchGuaranteeRegister   = (p)      => axios.get(`${BASE}/reports/guarantee-register`, { params: p });
export const fetchCashFlowReport      = (p)      => axios.get(`${BASE}/reports/cash-flow`, { params: p });
export const fetchForecastVsActual    = (p)      => axios.get(`${BASE}/reports/forecast-actual`, { params: p });
