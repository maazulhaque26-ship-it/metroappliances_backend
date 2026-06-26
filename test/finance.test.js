'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_finance';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

// ── 1. ChartOfAccount ─────────────────────────────────────────────────────────
describe('ChartOfAccount', () => {
  const ChartOfAccount = require('../models/ChartOfAccount');
  it('creates with required fields', async () => {
    const a = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    expect(a.accountCode.startsWith('COA-')).toBeTruthy();
    expect(a.isDeleted).toBe(false);
  });
  it('auto-generates accountCode', async () => {
    const a = await ChartOfAccount.create({ accountName: 'Revenue', accountType: 'revenue', accountNature: 'credit' });
    expect(a.accountCode).toMatch(/^COA-\d{4}-\d{5}$/);
  });
  it('rejects missing required fields', async () => {
    await expect(ChartOfAccount.create({ accountName: 'X' })).rejects.toThrow(/accountType/);
  });
});

// ── 2. AccountGroup ───────────────────────────────────────────────────────────
describe('AccountGroup', () => {
  const AccountGroup = require('../models/AccountGroup');
  it('creates with required fields', async () => {
    const g = await AccountGroup.create({ groupName: 'Current Assets', groupType: 'asset', nature: 'debit' });
    expect(g.groupCode.startsWith('AG-')).toBeTruthy();
    expect(g.isDeleted).toBe(false);
  });
  it('auto-generates groupCode', async () => {
    const g = await AccountGroup.create({ groupName: 'Revenue Group', groupType: 'revenue', nature: 'credit' });
    expect(g.groupCode).toMatch(/^AG-\d{4}$/);
  });
  it('rejects missing groupType', async () => {
    await expect(AccountGroup.create({ groupName: 'X', nature: 'debit' })).rejects.toThrow(/groupType/);
  });
});

// ── 3. FiscalYear ─────────────────────────────────────────────────────────────
describe('FiscalYear', () => {
  const FiscalYear = require('../models/FiscalYear');
  it('creates with required fields', async () => {
    const f = await FiscalYear.create({ name: 'FY 2025-26', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') });
    expect(f.yearCode.startsWith('FY-')).toBeTruthy();
    expect(f.status).toBe('open');
  });
  it('auto-generates yearCode', async () => {
    const f = await FiscalYear.create({ name: 'FY 2026-27', startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') });
    expect(f.yearCode).toMatch(/^FY-\d{4}$/);
  });
  it('rejects missing startDate', async () => {
    await expect(FiscalYear.create({ name: 'FY X', endDate: new Date('2026-03-31') })).rejects.toThrow(/startDate/);
  });
});

// ── 4. AccountingPeriod ───────────────────────────────────────────────────────
describe('AccountingPeriod', () => {
  const AccountingPeriod = require('../models/AccountingPeriod');
  const FiscalYear       = require('../models/FiscalYear');
  it('creates with required fields', async () => {
    const fy = await FiscalYear.create({ name: 'FY 2025-26', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') });
    const p  = await AccountingPeriod.create({ fiscalYear: fy._id, periodName: 'April 2025', periodNumber: 1, startDate: new Date('2025-04-01'), endDate: new Date('2025-04-30') });
    expect(p.periodCode.startsWith('AP-')).toBeTruthy();
    expect(p.status).toBe('open');
  });
  it('auto-generates periodCode', async () => {
    const fy = await FiscalYear.create({ name: 'FY 2025-26', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') });
    const p  = await AccountingPeriod.create({ fiscalYear: fy._id, periodName: 'May 2025', periodNumber: 2, startDate: new Date('2025-05-01'), endDate: new Date('2025-05-31') });
    expect(p.periodCode).toMatch(/^AP-\d{5}$/);
  });
  it('rejects missing fiscalYear', async () => {
    await expect(AccountingPeriod.create({ periodName: 'X', periodNumber: 1, startDate: new Date(), endDate: new Date() })).rejects.toThrow(/fiscalYear/);
  });
});

// ── 5. JournalEntry ───────────────────────────────────────────────────────────
describe('JournalEntry', () => {
  const JournalEntry = require('../models/JournalEntry');
  it('creates with required fields', async () => {
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'Test journal' });
    expect(j.journalNumber.startsWith('JV-')).toBeTruthy();
    expect(j.status).toBe('draft');
  });
  it('auto-generates journalNumber', async () => {
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'Test 2' });
    expect(j.journalNumber).toMatch(/^JV-\d{4}-\d{5}$/);
  });
  it('rejects missing narration', async () => {
    await expect(JournalEntry.create({ journalType: 'manual', entryDate: new Date() })).rejects.toThrow(/narration/);
  });
});

// ── 6. JournalLine ────────────────────────────────────────────────────────────
describe('JournalLine', () => {
  const JournalLine  = require('../models/JournalLine');
  const JournalEntry = require('../models/JournalEntry');
  const ChartOfAccount = require('../models/ChartOfAccount');
  it('creates with required fields', async () => {
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'JL test' });
    const a = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    const l = await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: a._id, debit: 1000 });
    expect(l.debit).toBe(1000);
    expect(l.credit).toBe(0);
  });
  it('defaults debit and credit to 0', async () => {
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'JL test 2' });
    const a = await ChartOfAccount.create({ accountName: 'Bank', accountType: 'asset', accountNature: 'debit' });
    const l = await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: a._id });
    expect(l.debit).toBe(0);
    expect(l.credit).toBe(0);
  });
  it('rejects missing journalEntry', async () => {
    const a = await ChartOfAccount.create({ accountName: 'Test', accountType: 'asset', accountNature: 'debit' });
    await expect(JournalLine.create({ lineNumber: 1, account: a._id })).rejects.toThrow(/journalEntry/);
  });
});

// ── 7. GeneralLedger ──────────────────────────────────────────────────────────
describe('GeneralLedger', () => {
  const GeneralLedger  = require('../models/GeneralLedger');
  const JournalEntry   = require('../models/JournalEntry');
  const JournalLine    = require('../models/JournalLine');
  const ChartOfAccount = require('../models/ChartOfAccount');
  it('creates with required fields', async () => {
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'GL test' });
    const a = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    const l = await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: a._id, debit: 500 });
    const g = await GeneralLedger.create({ account: a._id, journalEntry: j._id, journalLine: l._id, entryDate: new Date(), debit: 500 });
    expect(g.debit).toBe(500);
    expect(g.isDeleted).toBe(false);
  });
  it('defaults debit and credit to 0', async () => {
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'GL test 2' });
    const a = await ChartOfAccount.create({ accountName: 'Bank', accountType: 'asset', accountNature: 'debit' });
    const l = await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: a._id });
    const g = await GeneralLedger.create({ account: a._id, journalEntry: j._id, journalLine: l._id, entryDate: new Date() });
    expect(g.debit).toBe(0);
    expect(g.credit).toBe(0);
  });
  it('rejects missing account', async () => {
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'GL test 3' });
    const a = await ChartOfAccount.create({ accountName: 'Temp', accountType: 'asset', accountNature: 'debit' });
    const l = await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: a._id });
    await expect(GeneralLedger.create({ journalEntry: j._id, journalLine: l._id, entryDate: new Date() })).rejects.toThrow(/account/);
  });
});

// ── 8. LedgerBalance ─────────────────────────────────────────────────────────
describe('LedgerBalance', () => {
  const LedgerBalance  = require('../models/LedgerBalance');
  const ChartOfAccount = require('../models/ChartOfAccount');
  const FiscalYear     = require('../models/FiscalYear');
  it('creates with required fields', async () => {
    const a  = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    const fy = await FiscalYear.create({ name: 'FY25', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') });
    const lb = await LedgerBalance.create({ account: a._id, fiscalYear: fy._id });
    expect(lb.balance).toBe(0);
    expect(lb.periodDebit).toBe(0);
  });
  it('defaults all balance fields to 0', async () => {
    const a  = await ChartOfAccount.create({ accountName: 'Revenue', accountType: 'revenue', accountNature: 'credit' });
    const fy = await FiscalYear.create({ name: 'FY26', startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') });
    const lb = await LedgerBalance.create({ account: a._id, fiscalYear: fy._id });
    expect(lb.openingDebit).toBe(0);
    expect(lb.closingCredit).toBe(0);
  });
  it('rejects missing account', async () => {
    const fy = await FiscalYear.create({ name: 'FY27', startDate: new Date('2027-04-01'), endDate: new Date('2028-03-31') });
    await expect(LedgerBalance.create({ fiscalYear: fy._id })).rejects.toThrow(/account/);
  });
});

// ── 9. CostCenter ─────────────────────────────────────────────────────────────
describe('CostCenter', () => {
  const CostCenter = require('../models/CostCenter');
  it('creates with required fields', async () => {
    const c = await CostCenter.create({ name: 'Production Dept' });
    expect(c.centerCode.startsWith('CC-')).toBeTruthy();
    expect(c.isActive).toBe(true);
  });
  it('auto-generates centerCode', async () => {
    const c = await CostCenter.create({ name: 'QA Dept' });
    expect(c.centerCode).toMatch(/^CC-\d{4}$/);
  });
  it('rejects missing name', async () => {
    await expect(CostCenter.create({})).rejects.toThrow(/name/);
  });
});

// ── 10. ProfitCenter ──────────────────────────────────────────────────────────
describe('ProfitCenter', () => {
  const ProfitCenter = require('../models/ProfitCenter');
  it('creates with required fields', async () => {
    const p = await ProfitCenter.create({ name: 'North Region' });
    expect(p.centerCode.startsWith('PC-')).toBeTruthy();
    expect(p.isActive).toBe(true);
  });
  it('auto-generates centerCode', async () => {
    const p = await ProfitCenter.create({ name: 'South Region' });
    expect(p.centerCode).toMatch(/^PC-\d{4}$/);
  });
  it('rejects missing name', async () => {
    await expect(ProfitCenter.create({})).rejects.toThrow(/name/);
  });
});

// ── 11. Currency ──────────────────────────────────────────────────────────────
describe('Currency', () => {
  const Currency = require('../models/Currency');
  it('creates with required fields', async () => {
    const c = await Currency.create({ code: 'INR', name: 'Indian Rupee', symbol: '₹' });
    expect(c.code).toBe('INR');
    expect(c.isBase).toBe(false);
  });
  it('stores code in uppercase', async () => {
    const c = await Currency.create({ code: 'USD', name: 'US Dollar', symbol: '$' });
    expect(c.code).toBe('USD');
  });
  it('rejects missing symbol', async () => {
    await expect(Currency.create({ code: 'EUR', name: 'Euro' })).rejects.toThrow(/symbol/);
  });
});

// ── 12. ExchangeRate ──────────────────────────────────────────────────────────
describe('ExchangeRate', () => {
  const ExchangeRate = require('../models/ExchangeRate');
  it('creates with required fields', async () => {
    const r = await ExchangeRate.create({ fromCurrency: 'USD', toCurrency: 'INR', rate: 83.5, effectiveDate: new Date() });
    expect(r.rate).toBe(83.5);
    expect(r.isActive).toBe(true);
  });
  it('stores currencies uppercase', async () => {
    const r = await ExchangeRate.create({ fromCurrency: 'EUR', toCurrency: 'INR', rate: 90, effectiveDate: new Date() });
    expect(r.fromCurrency).toBe('EUR');
  });
  it('rejects missing rate', async () => {
    await expect(ExchangeRate.create({ fromCurrency: 'GBP', toCurrency: 'INR', effectiveDate: new Date() })).rejects.toThrow(/rate/);
  });
});

// ── 13. OpeningBalance ────────────────────────────────────────────────────────
describe('OpeningBalance', () => {
  const OpeningBalance = require('../models/OpeningBalance');
  const ChartOfAccount = require('../models/ChartOfAccount');
  const FiscalYear     = require('../models/FiscalYear');
  it('creates with required fields', async () => {
    const a  = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    const fy = await FiscalYear.create({ name: 'FY25', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') });
    const ob = await OpeningBalance.create({ account: a._id, fiscalYear: fy._id, debit: 10000 });
    expect(ob.debit).toBe(10000);
    expect(ob.isPosted).toBe(false);
  });
  it('defaults balances to 0', async () => {
    const a  = await ChartOfAccount.create({ accountName: 'Bank', accountType: 'asset', accountNature: 'debit' });
    const fy = await FiscalYear.create({ name: 'FY26', startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') });
    const ob = await OpeningBalance.create({ account: a._id, fiscalYear: fy._id });
    expect(ob.debit).toBe(0);
    expect(ob.credit).toBe(0);
  });
  it('rejects missing fiscalYear', async () => {
    const a = await ChartOfAccount.create({ accountName: 'AR', accountType: 'asset', accountNature: 'debit' });
    await expect(OpeningBalance.create({ account: a._id })).rejects.toThrow(/fiscalYear/);
  });
});

// ── 14. ClosingBalance ────────────────────────────────────────────────────────
describe('ClosingBalance', () => {
  const ClosingBalance = require('../models/ClosingBalance');
  const ChartOfAccount = require('../models/ChartOfAccount');
  const FiscalYear     = require('../models/FiscalYear');
  it('creates with required fields', async () => {
    const a  = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    const fy = await FiscalYear.create({ name: 'FY25', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') });
    const cb = await ClosingBalance.create({ account: a._id, fiscalYear: fy._id, balance: 50000 });
    expect(cb.balance).toBe(50000);
    expect(cb.isDeleted).toBe(false);
  });
  it('defaults balance to 0', async () => {
    const a  = await ChartOfAccount.create({ accountName: 'Revenue', accountType: 'revenue', accountNature: 'credit' });
    const fy = await FiscalYear.create({ name: 'FY26', startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') });
    const cb = await ClosingBalance.create({ account: a._id, fiscalYear: fy._id });
    expect(cb.balance).toBe(0);
  });
  it('rejects missing account', async () => {
    const fy = await FiscalYear.create({ name: 'FY27', startDate: new Date('2027-04-01'), endDate: new Date('2028-03-31') });
    await expect(ClosingBalance.create({ fiscalYear: fy._id })).rejects.toThrow(/account/);
  });
});

// ── 15. FinancialSetting ──────────────────────────────────────────────────────
describe('FinancialSetting', () => {
  const FinancialSetting = require('../models/FinancialSetting');
  it('creates with required fields', async () => {
    const f = await FinancialSetting.create({ company: 'Metro Appliances' });
    expect(f.baseCurrency).toBe('INR');
    expect(f.decimalPlaces).toBe(2);
  });
  it('defaults fiscalYearStart to 04-01', async () => {
    const f = await FinancialSetting.create({ company: 'Test Co' });
    expect(f.fiscalYearStart).toBe('04-01');
  });
  it('rejects missing company', async () => {
    await expect(FinancialSetting.create({})).rejects.toThrow(/company/);
  });
});

// ── 16. PostingRule ───────────────────────────────────────────────────────────
describe('PostingRule', () => {
  const PostingRule    = require('../models/PostingRule');
  const ChartOfAccount = require('../models/ChartOfAccount');
  it('creates with required fields', async () => {
    const dr = await ChartOfAccount.create({ accountName: 'AR', accountType: 'asset', accountNature: 'debit' });
    const cr = await ChartOfAccount.create({ accountName: 'Revenue', accountType: 'revenue', accountNature: 'credit' });
    const pr = await PostingRule.create({ name: 'Sales Invoice', sourceModule: 'sales', eventType: 'invoice_created', debitAccount: dr._id, creditAccount: cr._id });
    expect(pr.ruleCode.startsWith('PR-')).toBeTruthy();
    expect(pr.isActive).toBe(true);
  });
  it('auto-generates ruleCode', async () => {
    const dr = await ChartOfAccount.create({ accountName: 'Bank', accountType: 'asset', accountNature: 'debit' });
    const cr = await ChartOfAccount.create({ accountName: 'Rev2', accountType: 'revenue', accountNature: 'credit' });
    const pr = await PostingRule.create({ name: 'Sales Payment', sourceModule: 'sales', eventType: 'payment_received', debitAccount: dr._id, creditAccount: cr._id });
    expect(pr.ruleCode).toMatch(/^PR-\d{4}$/);
  });
  it('rejects invalid sourceModule', async () => {
    const dr = await ChartOfAccount.create({ accountName: 'Tmp', accountType: 'asset', accountNature: 'debit' });
    const cr = await ChartOfAccount.create({ accountName: 'Tmp2', accountType: 'revenue', accountNature: 'credit' });
    await expect(PostingRule.create({ name: 'X', sourceModule: 'unknown_module', eventType: 'X', debitAccount: dr._id, creditAccount: cr._id })).rejects.toThrow(/sourceModule/);
  });
});

// ── 17. PostingTemplate ───────────────────────────────────────────────────────
describe('PostingTemplate', () => {
  const PostingTemplate = require('../models/PostingTemplate');
  const ChartOfAccount  = require('../models/ChartOfAccount');
  it('creates with required fields', async () => {
    const a = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    const t = await PostingTemplate.create({ name: 'Sales JV', lines: [{ account: a._id, debitOrCredit: 'debit' }] });
    expect(t.templateCode.startsWith('PT-')).toBeTruthy();
    expect(t.isActive).toBe(true);
  });
  it('auto-generates templateCode', async () => {
    const a = await ChartOfAccount.create({ accountName: 'Bank', accountType: 'asset', accountNature: 'debit' });
    const t = await PostingTemplate.create({ name: 'Purchase JV', lines: [{ account: a._id, debitOrCredit: 'credit' }] });
    expect(t.templateCode).toMatch(/^PT-\d{4}$/);
  });
  it('rejects missing name', async () => {
    await expect(PostingTemplate.create({})).rejects.toThrow(/name/);
  });
});

// ── 18. VoucherSeries ─────────────────────────────────────────────────────────
describe('VoucherSeries', () => {
  const VoucherSeries = require('../models/VoucherSeries');
  it('creates with required fields', async () => {
    const v = await VoucherSeries.create({ name: 'Journal Voucher', voucherType: 'JV', prefix: 'JV/' });
    expect(v.seriesCode.startsWith('VS-')).toBeTruthy();
    expect(v.currentNumber).toBe(0);
  });
  it('auto-generates seriesCode', async () => {
    const v = await VoucherSeries.create({ name: 'Payment Voucher', voucherType: 'PV', prefix: 'PV/' });
    expect(v.seriesCode).toMatch(/^VS-\d{4}$/);
  });
  it('rejects invalid voucherType', async () => {
    await expect(VoucherSeries.create({ name: 'X', voucherType: 'INVALID', prefix: 'X/' })).rejects.toThrow(/voucherType/);
  });
});

// ── 19. Voucher ───────────────────────────────────────────────────────────────
describe('Voucher', () => {
  const Voucher = require('../models/Voucher');
  it('creates with required fields', async () => {
    const v = await Voucher.create({ voucherType: 'JV', voucherDate: new Date(), narration: 'Test JV', amount: 5000 });
    expect(v.voucherNumber.startsWith('VCH-')).toBeTruthy();
    expect(v.status).toBe('draft');
  });
  it('auto-generates voucherNumber', async () => {
    const v = await Voucher.create({ voucherType: 'PV', voucherDate: new Date(), narration: 'Payment', amount: 10000 });
    expect(v.voucherNumber).toMatch(/^VCH-\d{4}-\d{5}$/);
  });
  it('rejects missing narration', async () => {
    await expect(Voucher.create({ voucherType: 'JV', voucherDate: new Date(), amount: 1000 })).rejects.toThrow(/narration/);
  });
});

// ── 20. TrialBalanceSnapshot ──────────────────────────────────────────────────
describe('TrialBalanceSnapshot', () => {
  const TrialBalanceSnapshot = require('../models/TrialBalanceSnapshot');
  const FiscalYear           = require('../models/FiscalYear');
  it('creates with required fields', async () => {
    const fy = await FiscalYear.create({ name: 'FY25', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') });
    const tb = await TrialBalanceSnapshot.create({ fiscalYear: fy._id, asOfDate: new Date(), totalDebit: 100000, totalCredit: 100000, isBalanced: true });
    expect(tb.snapshotCode.startsWith('TB-')).toBeTruthy();
    expect(tb.isBalanced).toBe(true);
  });
  it('auto-generates snapshotCode', async () => {
    const fy = await FiscalYear.create({ name: 'FY26', startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') });
    const tb = await TrialBalanceSnapshot.create({ fiscalYear: fy._id, asOfDate: new Date() });
    expect(tb.snapshotCode).toMatch(/^TB-\d{4}-\d{5}$/);
  });
  it('rejects missing fiscalYear', async () => {
    await expect(TrialBalanceSnapshot.create({ asOfDate: new Date() })).rejects.toThrow(/fiscalYear/);
  });
});

// ── 21. AccountingDimension ───────────────────────────────────────────────────
describe('AccountingDimension', () => {
  const AccountingDimension = require('../models/AccountingDimension');
  it('creates with required fields', async () => {
    const d = await AccountingDimension.create({ name: 'Department', dimensionType: 'department' });
    expect(d.dimensionCode.startsWith('DIM-')).toBeTruthy();
    expect(d.isActive).toBe(true);
  });
  it('auto-generates dimensionCode', async () => {
    const d = await AccountingDimension.create({ name: 'Region', dimensionType: 'region' });
    expect(d.dimensionCode).toMatch(/^DIM-\d{4}$/);
  });
  it('rejects invalid dimensionType', async () => {
    await expect(AccountingDimension.create({ name: 'X', dimensionType: 'invalid_type' })).rejects.toThrow(/dimensionType/);
  });
});

// ── Double-Entry Validation ───────────────────────────────────────────────────
describe('Double-Entry Accounting Invariant', () => {
  const ChartOfAccount = require('../models/ChartOfAccount');
  const JournalEntry   = require('../models/JournalEntry');
  const JournalLine    = require('../models/JournalLine');

  it('sum of debits equals sum of credits when balanced', async () => {
    const cash = await ChartOfAccount.create({ accountName: 'Cash', accountType: 'asset', accountNature: 'debit' });
    const rev  = await ChartOfAccount.create({ accountName: 'Revenue', accountType: 'revenue', accountNature: 'credit' });
    const j    = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'Sale', totalDebit: 5000, totalCredit: 5000 });
    await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: cash._id, debit: 5000, credit: 0 });
    await JournalLine.create({ journalEntry: j._id, lineNumber: 2, account: rev._id,  debit: 0,    credit: 5000 });
    const lines = await JournalLine.find({ journalEntry: j._id });
    const totalD = lines.reduce((s, l) => s + l.debit,  0);
    const totalC = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalD).toBe(totalC);
    expect(totalD).toBe(5000);
  });

  it('detects imbalanced journal (debit ≠ credit)', async () => {
    const cash = await ChartOfAccount.create({ accountName: 'Cash2', accountType: 'asset', accountNature: 'debit' });
    const rev  = await ChartOfAccount.create({ accountName: 'Rev2',  accountType: 'revenue', accountNature: 'credit' });
    const j    = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'Bad Entry', totalDebit: 5000, totalCredit: 3000 });
    await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: cash._id, debit: 5000, credit: 0 });
    await JournalLine.create({ journalEntry: j._id, lineNumber: 2, account: rev._id,  debit: 0,    credit: 3000 });
    const lines = await JournalLine.find({ journalEntry: j._id });
    const totalD = lines.reduce((s, l) => s + l.debit,  0);
    const totalC = lines.reduce((s, l) => s + l.credit, 0);
    expect(Math.abs(totalD - totalC)).toBeGreaterThan(0);
  });

  it('multi-line journal sums correctly', async () => {
    const bankAcc  = await ChartOfAccount.create({ accountName: 'BankML',  accountType: 'asset',     accountNature: 'debit' });
    const arAcc    = await ChartOfAccount.create({ accountName: 'ARML',    accountType: 'asset',     accountNature: 'debit' });
    const salesAcc = await ChartOfAccount.create({ accountName: 'SalesML', accountType: 'revenue',   accountNature: 'credit' });
    const taxAcc   = await ChartOfAccount.create({ accountName: 'TaxML',   accountType: 'liability', accountNature: 'credit' });
    const accounts = [bankAcc, arAcc, salesAcc, taxAcc];
    const j = await JournalEntry.create({ journalType: 'manual', entryDate: new Date(), narration: 'Multi-line', totalDebit: 11800, totalCredit: 11800 });
    await JournalLine.create({ journalEntry: j._id, lineNumber: 1, account: accounts[0]._id, debit: 11800, credit: 0 });
    await JournalLine.create({ journalEntry: j._id, lineNumber: 2, account: accounts[2]._id, debit: 0, credit: 10000 });
    await JournalLine.create({ journalEntry: j._id, lineNumber: 3, account: accounts[3]._id, debit: 0, credit: 1800 });
    const lines = await JournalLine.find({ journalEntry: j._id });
    const totalD = lines.reduce((s, l) => s + l.debit,  0);
    const totalC = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalD).toBe(totalC);
    expect(totalD).toBe(11800);
  });
});
