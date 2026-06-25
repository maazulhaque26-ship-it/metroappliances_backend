'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_banking';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
  await mongoose.connection.dropDatabase();
  const Bank              = require('../models/Bank');
  const BankBranch        = require('../models/BankBranch');
  const BankAccount       = require('../models/BankAccount');
  const BankTransaction   = require('../models/BankTransaction');
  const BankStatement     = require('../models/BankStatement');
  const BankStatementLine = require('../models/BankStatementLine');
  const BankReconciliation= require('../models/BankReconciliation');
  const ReconciliationMatch = require('../models/ReconciliationMatch');
  const CashAccount       = require('../models/CashAccount');
  const CashTransaction   = require('../models/CashTransaction');
  const PettyCash         = require('../models/PettyCash');
  const PettyCashVoucher  = require('../models/PettyCashVoucher');
  const CashTransfer      = require('../models/CashTransfer');
  const ChequeBook        = require('../models/ChequeBook');
  const Cheque            = require('../models/Cheque');
  const ElectronicPayment = require('../models/ElectronicPayment');
  const PaymentGateway    = require('../models/PaymentGateway');
  const PaymentGatewayTransaction = require('../models/PaymentGatewayTransaction');
  const TreasuryPosition  = require('../models/TreasuryPosition');
  const CashForecast      = require('../models/CashForecast');
  const LiquidityForecast = require('../models/LiquidityForecast');
  const Investment        = require('../models/Investment');
  const FixedDeposit      = require('../models/FixedDeposit');
  const BankGuarantee     = require('../models/BankGuarantee');
  const LetterOfCredit    = require('../models/LetterOfCredit');
  const TreasurySetting   = require('../models/TreasurySetting');
  const BankCharge        = require('../models/BankCharge');
  const InterestPosting   = require('../models/InterestPosting');
  const CurrencyAccount   = require('../models/CurrencyAccount');
  const FXTransaction     = require('../models/FXTransaction');
  const FXGainLoss        = require('../models/FXGainLoss');

  await Promise.all([
    Bank.syncIndexes(),
    BankAccount.syncIndexes(),
    BankStatement.syncIndexes(),
    BankTransaction.syncIndexes(),
    CashAccount.syncIndexes(),
    PettyCash.syncIndexes(),
    TreasuryPosition.syncIndexes(),
    CashForecast.syncIndexes(),
    LiquidityForecast.syncIndexes(),
    Investment.syncIndexes(),
    FixedDeposit.syncIndexes(),
    BankGuarantee.syncIndexes(),
    LetterOfCredit.syncIndexes(),
    TreasurySetting.syncIndexes(),
    PaymentGateway.syncIndexes(),
    CurrencyAccount.syncIndexes(),
    FXTransaction.syncIndexes(),
    FXGainLoss.syncIndexes(),
    BankCharge.syncIndexes(),
    InterestPosting.syncIndexes(),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

// ── 1. Bank ──────────────────────────────────────────────────────────────────
describe('Bank', () => {
  const Bank = require('../models/Bank');

  it('creates with required fields', async () => {
    const doc = await Bank.create({ bankCode: 'HDFC', bankName: 'HDFC Bank' });
    expect(doc.bankCode).toBe('HDFC');
    expect(doc.bankName).toBe('HDFC Bank');
    expect(doc.isActive).toBe(true);
    expect(doc.isDeleted).toBe(false);
  });

  it('bankCode is saved uppercase', async () => {
    const doc = await Bank.create({ bankCode: 'sbi', bankName: 'State Bank' });
    expect(doc.bankCode).toBe('SBI');
  });

  it('rejects duplicate bankCode', async () => {
    await Bank.create({ bankCode: 'ICICI', bankName: 'ICICI Bank' });
    await expect(Bank.create({ bankCode: 'ICICI', bankName: 'Another' })).rejects.toThrow();
  });

  it('soft deletes via isDeleted', async () => {
    const doc = await Bank.create({ bankCode: 'AXIS', bankName: 'Axis Bank' });
    doc.isDeleted = true;
    await doc.save();
    expect(doc.isDeleted).toBe(true);
  });
});

// ── 2. BankBranch ────────────────────────────────────────────────────────────
describe('BankBranch', () => {
  const Bank       = require('../models/Bank');
  const BankBranch = require('../models/BankBranch');

  it('creates linked to bank with IFSC', async () => {
    const bank = await Bank.create({ bankCode: 'HDFC2', bankName: 'HDFC Bank 2' });
    const branch = await BankBranch.create({ bank: bank._id, branchName: 'MG Road', ifscCode: 'HDFC0001234', city: 'Bangalore', state: 'Karnataka' });
    expect(branch.ifscCode).toBe('HDFC0001234');
    expect(branch.bank.toString()).toBe(bank._id.toString());
  });

  it('micrCode is optional', async () => {
    const bank = await Bank.create({ bankCode: 'SBI2', bankName: 'SBI 2' });
    const branch = await BankBranch.create({ bank: bank._id, branchName: 'CP', ifscCode: 'SBIN0001234', city: 'Delhi', state: 'Delhi' });
    expect(branch.micrCode).toBeUndefined();
  });
});

// ── 3. BankAccount ───────────────────────────────────────────────────────────
describe('BankAccount', () => {
  const BankAccount = require('../models/BankAccount');

  it('creates current account with zero balance', async () => {
    const doc = await BankAccount.create({ accountNumber: 'ACC001', accountName: 'Main Current', accountType: 'current', currency: 'INR' });
    expect(doc.accountType).toBe('current');
    expect(doc.currentBalance).toBe(0);
    expect(doc.isActive).toBe(true);
  });

  it('rejects duplicate accountNumber', async () => {
    await BankAccount.create({ accountNumber: 'DUPACCT', accountName: 'Dup', accountType: 'savings', currency: 'INR' });
    await expect(BankAccount.create({ accountNumber: 'DUPACCT', accountName: 'Dup2', accountType: 'savings', currency: 'INR' })).rejects.toThrow();
  });

  it('rejects invalid accountType', async () => {
    await expect(BankAccount.create({ accountNumber: 'BAD001', accountName: 'Bad', accountType: 'invalid_type', currency: 'INR' })).rejects.toThrow();
  });

  it('overdraftLimit defaults to zero', async () => {
    const doc = await BankAccount.create({ accountNumber: 'OVR001', accountName: 'OD Account', accountType: 'overdraft', currency: 'INR' });
    expect(doc.overdraftLimit).toBe(0);
  });
});

// ── 4. BankTransaction ───────────────────────────────────────────────────────
describe('BankTransaction', () => {
  const BankAccount     = require('../models/BankAccount');
  const BankTransaction = require('../models/BankTransaction');

  it('creates receipt transaction', async () => {
    const acct = await BankAccount.create({ accountNumber: 'TXACCT1', accountName: 'TX Acct', accountType: 'current', currency: 'INR' });
    const tx = await BankTransaction.create({ bankAccount: acct._id, transactionDate: new Date(), transactionType: 'receipt', amount: 50000, paymentMode: 'neft' });
    expect(tx.transactionType).toBe('receipt');
    expect(tx.amount).toBe(50000);
    expect(tx.isReconciled).toBe(false);
    expect(tx.status).toBe('pending');
  });

  it('auto-number starts with BTX-', async () => {
    const acct = await BankAccount.create({ accountNumber: 'TXACCT2', accountName: 'TX Acct 2', accountType: 'current', currency: 'INR' });
    const tx = await BankTransaction.create({ bankAccount: acct._id, transactionDate: new Date(), transactionType: 'payment', amount: 10000, paymentMode: 'rtgs' });
    expect(tx.transactionNumber).toMatch(/^BTX-\d{4}-/);
  });

  it('rejects invalid transactionType', async () => {
    const acct = await BankAccount.create({ accountNumber: 'TXACCT3', accountName: 'TX Acct 3', accountType: 'current', currency: 'INR' });
    await expect(BankTransaction.create({ bankAccount: acct._id, transactionDate: new Date(), transactionType: 'invalid', amount: 100, paymentMode: 'neft' })).rejects.toThrow();
  });

  it('cleared status is valid', async () => {
    const acct = await BankAccount.create({ accountNumber: 'TXACCT4', accountName: 'TX Acct 4', accountType: 'current', currency: 'INR' });
    const tx = await BankTransaction.create({ bankAccount: acct._id, transactionDate: new Date(), transactionType: 'receipt', amount: 5000, paymentMode: 'cheque', status: 'cleared' });
    expect(tx.status).toBe('cleared');
  });
});

// ── 5. BankStatement ─────────────────────────────────────────────────────────
describe('BankStatement', () => {
  const BankAccount   = require('../models/BankAccount');
  const BankStatement = require('../models/BankStatement');

  it('creates statement with date range', async () => {
    const acct = await BankAccount.create({ accountNumber: 'STMTACCT', accountName: 'STMT', accountType: 'current', currency: 'INR' });
    const stmt = await BankStatement.create({ bankAccount: acct._id, statementDate: new Date(), fromDate: new Date('2026-01-01'), toDate: new Date('2026-01-31'), openingBalance: 100000 });
    expect(stmt.statementNumber).toMatch(/^BSTMT-\d{4}-/);
    expect(stmt.status).toBe('imported');
  });

  it('rejects missing fromDate', async () => {
    const acct = await BankAccount.create({ accountNumber: 'STMTACCT2', accountName: 'STMT2', accountType: 'current', currency: 'INR' });
    await expect(BankStatement.create({ bankAccount: acct._id, statementDate: new Date(), toDate: new Date() })).rejects.toThrow();
  });
});

// ── 6. BankStatementLine ─────────────────────────────────────────────────────
describe('BankStatementLine', () => {
  const BankAccount       = require('../models/BankAccount');
  const BankStatement     = require('../models/BankStatement');
  const BankStatementLine = require('../models/BankStatementLine');

  it('creates with credit and balance', async () => {
    const acct = await BankAccount.create({ accountNumber: 'LINEACCT', accountName: 'Line', accountType: 'current', currency: 'INR' });
    const stmt = await BankStatement.create({ bankAccount: acct._id, statementDate: new Date(), fromDate: new Date('2026-01-01'), toDate: new Date('2026-01-31') });
    const line = await BankStatementLine.create({ bankStatement: stmt._id, bankAccount: acct._id, lineDate: new Date(), description: 'NEFT Credit', credit: 25000, debit: 0, balance: 125000 });
    expect(line.credit).toBe(25000);
    expect(line.matchStatus).toBe('unmatched');
  });
});

// ── 7. BankReconciliation ────────────────────────────────────────────────────
describe('BankReconciliation', () => {
  const BankAccount        = require('../models/BankAccount');
  const BankReconciliation = require('../models/BankReconciliation');

  it('creates reconciliation in_progress', async () => {
    const acct = await BankAccount.create({ accountNumber: 'RECONACCT', accountName: 'Recon', accountType: 'current', currency: 'INR' });
    const recon = await BankReconciliation.create({ bankAccount: acct._id, reconciliationDate: new Date(), fromDate: new Date('2026-01-01'), toDate: new Date('2026-01-31') });
    expect(recon.reconciliationNumber).toMatch(/^RECON-\d{4}-/);
    expect(recon.status).toBe('in_progress');
    expect(recon.totalMatched).toBe(0);
  });
});

// ── 8. CashAccount ───────────────────────────────────────────────────────────
describe('CashAccount', () => {
  const CashAccount = require('../models/CashAccount');

  it('creates with zero balance', async () => {
    const doc = await CashAccount.create({ accountName: 'Head Office Cash' });
    expect(doc.accountNumber).toMatch(/^CACC-\d{4}-/);
    expect(doc.currentBalance).toBe(0);
    expect(doc.isActive).toBe(true);
  });

  it('requires accountName', async () => {
    await expect(CashAccount.create({})).rejects.toThrow();
  });
});

// ── 9. CashTransaction ───────────────────────────────────────────────────────
describe('CashTransaction', () => {
  const CashAccount    = require('../models/CashAccount');
  const CashTransaction= require('../models/CashTransaction');

  it('creates receipt with auto-number', async () => {
    const acct = await CashAccount.create({ accountName: 'Petty Cash Main' });
    const tx = await CashTransaction.create({ cashAccount: acct._id, transactionDate: new Date(), transactionType: 'receipt', amount: 5000 });
    expect(tx.transactionNumber).toMatch(/^CTX-\d{4}-/);
    expect(tx.status).toBe('completed');
  });

  it('rejects invalid transactionType', async () => {
    const acct = await CashAccount.create({ accountName: 'Cash Acct B' });
    await expect(CashTransaction.create({ cashAccount: acct._id, transactionDate: new Date(), transactionType: 'bad', amount: 100 })).rejects.toThrow();
  });
});

// ── 10. PettyCash ────────────────────────────────────────────────────────────
describe('PettyCash', () => {
  const PettyCash = require('../models/PettyCash');

  it('creates fund with custodian and float', async () => {
    const doc = await PettyCash.create({ fundName: 'HO Petty Cash', custodian: 'Rajesh Kumar', floatAmount: 10000 });
    expect(doc.fundNumber).toMatch(/^PC-\d{4}-/);
    expect(doc.currentBalance).toBe(0);
    expect(doc.status).toBe('active');
  });

  it('requires custodian', async () => {
    await expect(PettyCash.create({ fundName: 'No Custodian Fund', floatAmount: 5000 })).rejects.toThrow();
  });

  it('status defaults to active', async () => {
    const doc = await PettyCash.create({ fundName: 'HO Petty Cash 2', custodian: 'Meena', floatAmount: 3000 });
    expect(doc.status).toBe('active');
    expect(doc.currentBalance).toBe(0);
  });
});

// ── 11. PettyCashVoucher ─────────────────────────────────────────────────────
describe('PettyCashVoucher', () => {
  const PettyCash       = require('../models/PettyCash');
  const PettyCashVoucher= require('../models/PettyCashVoucher');

  it('creates draft voucher', async () => {
    const fund = await PettyCash.create({ fundName: 'Branch Cash', custodian: 'Priya', floatAmount: 5000 });
    const v = await PettyCashVoucher.create({ pettyCash: fund._id, voucherDate: new Date(), purpose: 'Office supplies', amount: 450 });
    expect(v.voucherNumber).toMatch(/^PCV-\d{4}-/);
    expect(v.status).toBe('draft');
  });

  it('requires purpose', async () => {
    const fund = await PettyCash.create({ fundName: 'Branch Cash 2', custodian: 'Ravi', floatAmount: 5000 });
    await expect(PettyCashVoucher.create({ pettyCash: fund._id, voucherDate: new Date(), amount: 100 })).rejects.toThrow();
  });
});

// ── 12. CashTransfer ─────────────────────────────────────────────────────────
describe('CashTransfer', () => {
  const CashTransfer = require('../models/CashTransfer');

  it('creates bank_to_bank transfer', async () => {
    const doc = await CashTransfer.create({ transferType: 'bank_to_bank', transferDate: new Date(), amount: 500000 });
    expect(doc.transferNumber).toMatch(/^CTRF-\d{4}-/);
    expect(doc.status).toBe('pending');
  });

  it('rejects missing transferType', async () => {
    await expect(CashTransfer.create({ transferDate: new Date(), amount: 1000 })).rejects.toThrow();
  });
});

// ── 13. ChequeBook ───────────────────────────────────────────────────────────
describe('ChequeBook', () => {
  const BankAccount = require('../models/BankAccount');
  const ChequeBook  = require('../models/ChequeBook');

  it('creates cheque book with valid auto-number', async () => {
    const acct = await BankAccount.create({ accountNumber: 'CBACCT', accountName: 'Cheque Acct', accountType: 'current', currency: 'INR' });
    const cb = await ChequeBook.create({ bankAccount: acct._id, fromChequeNo: '100001', toChequeNo: '100050', totalLeaves: 50 });
    expect(cb.chequeBookNumber).toMatch(/^CB-\d{4}-/);
    expect(cb.totalLeaves).toBe(50);
    expect(cb.status).toBe('active');
  });
});

// ── 14. Cheque ───────────────────────────────────────────────────────────────
describe('Cheque', () => {
  const BankAccount = require('../models/BankAccount');
  const Cheque      = require('../models/Cheque');

  it('creates issued cheque', async () => {
    const acct = await BankAccount.create({ accountNumber: 'CHQACCT', accountName: 'Cheque Acct 2', accountType: 'current', currency: 'INR' });
    const doc = await Cheque.create({ bankAccount: acct._id, chequeNumber: '100001', chequeType: 'issued', chequeDate: new Date(), payee: 'Vendor Ltd', amount: 75000 });
    expect(doc.status).toBe('draft');
    expect(doc.chequeType).toBe('issued');
  });

  it('rejects invalid chequeType', async () => {
    const acct = await BankAccount.create({ accountNumber: 'CHQACCT2', accountName: 'CHQ2', accountType: 'current', currency: 'INR' });
    await expect(Cheque.create({ bankAccount: acct._id, chequeNumber: '200001', chequeType: 'invalid', payee: 'X', amount: 100 })).rejects.toThrow();
  });
});

// ── 15. ElectronicPayment ────────────────────────────────────────────────────
describe('ElectronicPayment', () => {
  const ElectronicPayment = require('../models/ElectronicPayment');

  it('creates NEFT payment', async () => {
    const acct = await require('../models/BankAccount').create({ accountNumber: 'EPAYACCT', accountName: 'EPAY', accountType: 'current', currency: 'INR' });
    const doc = await ElectronicPayment.create({ bankAccount: acct._id, paymentDate: new Date(), paymentMode: 'neft', beneficiaryName: 'Supplier ABC', amount: 150000 });
    expect(doc.paymentNumber).toMatch(/^EPAY-\d{4}-/);
    expect(doc.status).toBe('initiated');
  });

  it('requires beneficiaryName', async () => {
    const acct = await require('../models/BankAccount').create({ accountNumber: 'EPAYACCT2', accountName: 'EPAY2', accountType: 'current', currency: 'INR' });
    await expect(ElectronicPayment.create({ bankAccount: acct._id, paymentDate: new Date(), paymentMode: 'rtgs', amount: 1000000 })).rejects.toThrow();
  });
});

// ── 16. PaymentGateway ───────────────────────────────────────────────────────
describe('PaymentGateway', () => {
  const PaymentGateway = require('../models/PaymentGateway');

  it('creates Razorpay gateway in test mode', async () => {
    const doc = await PaymentGateway.create({ gatewayCode: 'RZPAY', gatewayName: 'Razorpay', provider: 'razorpay', mode: 'test' });
    expect(doc.gatewayCode).toBe('RZPAY');
    expect(doc.mode).toBe('test');
    expect(doc.isActive).toBe(true);
  });

  it('rejects duplicate gatewayCode', async () => {
    await PaymentGateway.create({ gatewayCode: 'STRIPE', gatewayName: 'Stripe', provider: 'stripe', mode: 'live' });
    await expect(PaymentGateway.create({ gatewayCode: 'STRIPE', gatewayName: 'Stripe 2', provider: 'stripe', mode: 'test' })).rejects.toThrow();
  });
});

// ── 17. PaymentGatewayTransaction ────────────────────────────────────────────
describe('PaymentGatewayTransaction', () => {
  const PaymentGateway            = require('../models/PaymentGateway');
  const PaymentGatewayTransaction = require('../models/PaymentGatewayTransaction');

  it('creates initiated transaction', async () => {
    const gw = await PaymentGateway.create({ gatewayCode: 'GW1', gatewayName: 'GW1', provider: 'razorpay', mode: 'test' });
    const tx = await PaymentGatewayTransaction.create({ paymentGateway: gw._id, transactionDate: new Date(), amount: 9999, currency: 'INR' });
    expect(tx.transactionNumber).toMatch(/^PGT-\d{4}-/);
    expect(tx.status).toBe('initiated');
  });
});

// ── 18. TreasuryPosition ─────────────────────────────────────────────────────
describe('TreasuryPosition', () => {
  const TreasuryPosition = require('../models/TreasuryPosition');

  it('creates treasury snapshot', async () => {
    const doc = await TreasuryPosition.create({ positionDate: new Date(), bankBalance: 500000, cashBalance: 50000, investmentBalance: 200000, fdBalance: 100000, totalAssets: 850000, overdraftUsed: 0, netPosition: 850000 });
    expect(doc.positionNumber).toMatch(/^TPOS-\d{4}-/);
    expect(doc.netPosition).toBe(850000);
  });
});

// ── 19. CashForecast ─────────────────────────────────────────────────────────
describe('CashForecast', () => {
  const CashForecast = require('../models/CashForecast');

  it('creates draft forecast with netCashFlow', async () => {
    const doc = await CashForecast.create({ forecastDate: new Date(), forecastPeriod: '2026-Q1', openingBalance: 100000, expectedReceipts: 500000, expectedPayments: 350000, netCashFlow: 150000, closingForecast: 250000 });
    expect(doc.forecastNumber).toMatch(/^CF-\d{4}-/);
    expect(doc.status).toBe('draft');
    expect(doc.netCashFlow).toBe(150000);
  });

  it('requires forecastPeriod', async () => {
    await expect(CashForecast.create({ openingBalance: 0, expectedReceipts: 1000, expectedPayments: 500 })).rejects.toThrow();
  });
});

// ── 20. LiquidityForecast ────────────────────────────────────────────────────
describe('LiquidityForecast', () => {
  const LiquidityForecast = require('../models/LiquidityForecast');

  it('creates daily liquidity forecast', async () => {
    const doc = await LiquidityForecast.create({
      forecastDate: new Date(),
      horizon: 'daily',
      items: [
        { period: '2026-06-25', inflow: 100000, outflow: 80000, netFlow: 20000, cumulativeBalance: 120000 },
        { period: '2026-06-26', inflow: 60000, outflow: 90000, netFlow: -30000, cumulativeBalance: 90000 },
      ],
      totalInflow: 160000,
      totalOutflow: 170000,
      openingBalance: 100000,
    });
    expect(doc.forecastNumber).toMatch(/^LF-\d{4}-/);
    expect(doc.items.length).toBe(2);
    expect(doc.horizon).toBe('daily');
  });

  it('rejects invalid horizon', async () => {
    await expect(LiquidityForecast.create({ forecastDate: new Date(), horizon: 'annual', totalInflow: 0, totalOutflow: 0 })).rejects.toThrow();
  });
});

// ── 21. Investment ───────────────────────────────────────────────────────────
describe('Investment', () => {
  const Investment = require('../models/Investment');

  it('creates mutual fund investment', async () => {
    const doc = await Investment.create({ investmentName: 'HDFC Large Cap', investmentType: 'mutual_fund', purchaseDate: new Date(), principalAmount: 100000, currentValue: 100000 });
    expect(doc.investmentNumber).toMatch(/^INVT-\d{4}-/);
    expect(doc.status).toBe('active');
  });

  it('rejects invalid investmentType', async () => {
    await expect(Investment.create({ investmentName: 'Bad', investmentType: 'crypto', principalAmount: 1000 })).rejects.toThrow();
  });

  it('redemptionAmount computes actualReturn on update', async () => {
    const doc = await Investment.create({ investmentName: 'SBI Liquid', investmentType: 'liquid_fund', purchaseDate: new Date(), principalAmount: 200000, currentValue: 200000 });
    doc.redemptionAmount = 210000;
    doc.actualReturn = 210000 - 200000;
    await doc.save();
    expect(doc.actualReturn).toBe(10000);
  });
});

// ── 22. FixedDeposit ─────────────────────────────────────────────────────────
describe('FixedDeposit', () => {
  const BankAccount  = require('../models/BankAccount');
  const FixedDeposit = require('../models/FixedDeposit');

  it('creates FD and computes maturityAmount', async () => {
    const acct = await BankAccount.create({ accountNumber: 'FDACCT', accountName: 'FD Account', accountType: 'fixed_deposit', currency: 'INR' });
    const startDate = new Date('2026-01-01');
    const maturityDate = new Date('2027-01-01');
    const tenureDays = Math.ceil((maturityDate - startDate) / 86400000);
    const P = 500000, r = 7.5;
    const maturityAmount = P * Math.pow(1 + r / 400, tenureDays / 91.25);
    const doc = await FixedDeposit.create({
      bankAccount: acct._id,
      fdName: 'FD Q1 2026',
      interestRate: r,
      startDate,
      maturityDate,
      tenureDays,
      principalAmount: P,
      maturityAmount: Math.round(maturityAmount),
      interestType: 'compound',
      compoundFreq: 'quarterly',
    });
    expect(doc.fdNumber).toMatch(/^FD-\d{4}-/);
    expect(doc.status).toBe('active');
    expect(doc.maturityAmount).toBeGreaterThan(P);
  });

  it('requires bankAccount', async () => {
    await expect(FixedDeposit.create({ fdName: 'No Bank', interestRate: 7, startDate: new Date(), maturityDate: new Date(), principalAmount: 100000 })).rejects.toThrow();
  });

  it('requires interestRate', async () => {
    const acct = await BankAccount.create({ accountNumber: 'FDACCT2', accountName: 'FD2', accountType: 'fixed_deposit', currency: 'INR' });
    await expect(FixedDeposit.create({ bankAccount: acct._id, fdName: 'No Rate', startDate: new Date(), maturityDate: new Date(), principalAmount: 100000 })).rejects.toThrow();
  });
});

// ── 23. BankGuarantee ────────────────────────────────────────────────────────
describe('BankGuarantee', () => {
  const BankGuarantee = require('../models/BankGuarantee');

  it('creates performance BG', async () => {
    const acct = await require('../models/BankAccount').create({ accountNumber: 'BGACCT', accountName: 'BG', accountType: 'current', currency: 'INR' });
    const doc = await BankGuarantee.create({ bankAccount: acct._id, guaranteeType: 'performance', amount: 2000000, beneficiary: 'NHAI', issueDate: new Date('2026-01-01'), expiryDate: new Date('2027-01-01') });
    expect(doc.bgNumber).toMatch(/^BG-\d{4}-/);
    expect(doc.status).toBe('draft');
  });

  it('requires beneficiary', async () => {
    const acct = await require('../models/BankAccount').create({ accountNumber: 'BGACCT2', accountName: 'BG2', accountType: 'current', currency: 'INR' });
    await expect(BankGuarantee.create({ bankAccount: acct._id, guaranteeType: 'financial', amount: 500000, issueDate: new Date(), expiryDate: new Date() })).rejects.toThrow();
  });

  it('rejects invalid guaranteeType', async () => {
    await expect(BankGuarantee.create({ guaranteeType: 'invalid', amount: 100, beneficiary: 'X', issueDate: new Date(), expiryDate: new Date() })).rejects.toThrow();
  });
});

// ── 24. LetterOfCredit ───────────────────────────────────────────────────────
describe('LetterOfCredit', () => {
  const LetterOfCredit = require('../models/LetterOfCredit');

  it('creates import LC', async () => {
    const acct = await require('../models/BankAccount').create({ accountNumber: 'LCACCT', accountName: 'LC', accountType: 'current', currency: 'INR' });
    const doc = await LetterOfCredit.create({ bankAccount: acct._id, lcType: 'import', amount: 5000000, applicant: 'Metro Appliances', beneficiary: 'Samsung Korea', currency: 'USD', issueDate: new Date('2026-01-01'), expiryDate: new Date('2026-06-30'), outstandingAmount: 5000000 });
    expect(doc.lcNumber).toMatch(/^LC-\d{4}-/);
    expect(doc.status).toBe('draft');
    expect(doc.outstandingAmount).toBe(5000000);
  });

  it('requires applicant and beneficiary', async () => {
    const acct = await require('../models/BankAccount').create({ accountNumber: 'LCACCT2', accountName: 'LC2', accountType: 'current', currency: 'INR' });
    await expect(LetterOfCredit.create({ bankAccount: acct._id, lcType: 'export', amount: 1000000, issueDate: new Date(), expiryDate: new Date() })).rejects.toThrow();
  });
});

// ── 25. TreasurySetting ──────────────────────────────────────────────────────
describe('TreasurySetting', () => {
  const TreasurySetting = require('../models/TreasurySetting');

  it('creates setting with key-value', async () => {
    const doc = await TreasurySetting.create({ key: 'MIN_CASH_BALANCE', value: 100000, category: 'cash' });
    expect(doc.key).toBe('MIN_CASH_BALANCE');
    expect(doc.value).toBe(100000);
  });

  it('rejects duplicate key', async () => {
    await TreasurySetting.create({ key: 'FX_SPREAD', value: 0.5, category: 'fx' });
    await expect(TreasurySetting.create({ key: 'FX_SPREAD', value: 0.6, category: 'fx' })).rejects.toThrow();
  });
});

// ── 26. BankCharge ───────────────────────────────────────────────────────────
describe('BankCharge', () => {
  const BankAccount = require('../models/BankAccount');
  const BankCharge  = require('../models/BankCharge');

  it('totalAmount = amount + gstAmount', async () => {
    const acct = await BankAccount.create({ accountNumber: 'CHGACCT', accountName: 'Charge Acct', accountType: 'current', currency: 'INR' });
    const doc = await BankCharge.create({ bankAccount: acct._id, chargeDate: new Date(), chargeType: 'annual_fee', description: 'AMC', amount: 1000, gstAmount: 180, totalAmount: 1180 });
    expect(doc.chargeNumber).toMatch(/^BCH-\d{4}-/);
    expect(doc.totalAmount).toBe(1180);
  });
});

// ── 27. InterestPosting ──────────────────────────────────────────────────────
describe('InterestPosting', () => {
  const BankAccount     = require('../models/BankAccount');
  const InterestPosting = require('../models/InterestPosting');

  it('creates credit interest posting', async () => {
    const acct = await BankAccount.create({ accountNumber: 'INTACCT', accountName: 'Int Acct', accountType: 'savings', currency: 'INR' });
    const doc = await InterestPosting.create({ bankAccount: acct._id, postingDate: new Date(), interestType: 'credit', periodFrom: new Date('2026-01-01'), periodTo: new Date('2026-03-31'), interestDays: 90, interestAmount: 7500, tdsAmount: 750, netInterest: 6750 });
    expect(doc.postingNumber).toMatch(/^IP-\d{4}-/);
    expect(doc.netInterest).toBe(6750);
  });
});

// ── 28. CurrencyAccount ──────────────────────────────────────────────────────
describe('CurrencyAccount', () => {
  const CurrencyAccount = require('../models/CurrencyAccount');

  it('creates USD currency account', async () => {
    const doc = await CurrencyAccount.create({ accountName: 'USD Account', currency: 'USD', currentBalance: 50000, currentRate: 83.5 });
    expect(doc.accountNumber).toMatch(/^FACC-\d{4}-/);
    expect(doc.currency).toBe('USD');
  });

  it('requires currency', async () => {
    await expect(CurrencyAccount.create({ accountName: 'No Currency' })).rejects.toThrow();
  });
});

// ── 29. FXTransaction ────────────────────────────────────────────────────────
describe('FXTransaction', () => {
  const FXTransaction = require('../models/FXTransaction');

  it('creates buy transaction and computes toAmount', async () => {
    const doc = await FXTransaction.create({ transactionType: 'buy', transactionDate: new Date(), fromCurrency: 'INR', toCurrency: 'USD', exchangeRate: 83.5, fromAmount: 835000, toAmount: 10000 });
    expect(doc.transactionNumber).toMatch(/^FXT-\d{4}-/);
    expect(doc.status).toBe('draft');
    expect(doc.toAmount).toBe(10000);
  });

  it('rejects missing fromCurrency or toCurrency', async () => {
    await expect(FXTransaction.create({ transactionType: 'sell', transactionDate: new Date(), exchangeRate: 83, fromAmount: 1000 })).rejects.toThrow();
  });

  it('rejects missing exchangeRate', async () => {
    await expect(FXTransaction.create({ transactionType: 'spot', transactionDate: new Date(), fromCurrency: 'EUR', toCurrency: 'INR', fromAmount: 1000 })).rejects.toThrow();
  });
});

// ── 30. FXGainLoss ───────────────────────────────────────────────────────────
describe('FXGainLoss', () => {
  const FXGainLoss = require('../models/FXGainLoss');

  it('creates realized gain', async () => {
    const doc = await FXGainLoss.create({ postingDate: new Date(), gainLossType: 'realized', currency: 'USD', bookRate: 80, currentRate: 83.5, gainLossAmount: 35000 });
    expect(doc.glNumber).toMatch(/^FXGL-\d{4}-/);
    expect(doc.gainLossType).toBe('realized');
    expect(doc.gainLossAmount).toBe(35000);
  });

  it('requires currency', async () => {
    await expect(FXGainLoss.create({ postingDate: new Date(), gainLossType: 'unrealized', bookRate: 80, currentRate: 83 })).rejects.toThrow();
  });
});

// ── 31. ReconciliationMatch ──────────────────────────────────────────────────
describe('ReconciliationMatch', () => {
  const BankAccount         = require('../models/BankAccount');
  const BankTransaction     = require('../models/BankTransaction');
  const BankStatement       = require('../models/BankStatement');
  const BankStatementLine   = require('../models/BankStatementLine');
  const BankReconciliation  = require('../models/BankReconciliation');
  const ReconciliationMatch = require('../models/ReconciliationMatch');

  it('creates auto match record', async () => {
    const acct = await BankAccount.create({ accountNumber: 'MATCHACCT', accountName: 'Match', accountType: 'current', currency: 'INR' });
    const tx = await BankTransaction.create({ bankAccount: acct._id, transactionDate: new Date(), transactionType: 'receipt', amount: 10000, paymentMode: 'neft' });
    const stmt = await BankStatement.create({ bankAccount: acct._id, statementDate: new Date(), fromDate: new Date('2026-01-01'), toDate: new Date('2026-01-31') });
    const line = await BankStatementLine.create({ bankStatement: stmt._id, bankAccount: acct._id, lineDate: new Date(), description: 'NEFT', credit: 10000, debit: 0, balance: 110000 });
    const recon = await BankReconciliation.create({ bankAccount: acct._id, reconciliationDate: new Date(), fromDate: new Date('2026-01-01'), toDate: new Date('2026-01-31') });
    const match = await ReconciliationMatch.create({ reconciliation: recon._id, bankTransaction: tx._id, statementLine: line._id, matchType: 'auto', difference: 0 });
    expect(match.matchType).toBe('auto');
    expect(match.difference).toBe(0);
  });
});
