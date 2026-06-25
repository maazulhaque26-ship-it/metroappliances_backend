const GeneralLedger       = require('../models/GeneralLedger');
const ChartOfAccount      = require('../models/ChartOfAccount');
const JournalEntry        = require('../models/JournalEntry');
const JournalLine         = require('../models/JournalLine');
const LedgerBalance       = require('../models/LedgerBalance');
const TrialBalanceSnapshot = require('../models/TrialBalanceSnapshot');
const { ok, serverError, fail, created } = require('../utils/response');

// ── Trial Balance ─────────────────────────────────────────────────────────────

exports.getTrialBalance = async (req, res) => {
  try {
    const { fiscalYear, period, asOfDate } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    if (period)     q.period     = period;
    if (asOfDate)   q.entryDate  = { $lte: new Date(asOfDate) };

    const entries = await GeneralLedger.find(q).lean();
    const accountMap = {};
    entries.forEach(e => {
      const id = String(e.account);
      if (!accountMap[id]) accountMap[id] = { account: e.account, debit: 0, credit: 0 };
      accountMap[id].debit  += e.debit;
      accountMap[id].credit += e.credit;
    });

    const accountIds = Object.keys(accountMap);
    const accounts = await ChartOfAccount.find({ _id: { $in: accountIds } }, 'accountCode accountName accountType').lean();
    const accIndex = {};
    accounts.forEach(a => { accIndex[String(a._id)] = a; });

    const rows = accountIds.map(id => ({
      account:     accIndex[id] || { accountCode: '?', accountName: 'Unknown', accountType: 'unknown' },
      debit:       accountMap[id].debit,
      credit:      accountMap[id].credit,
    })).filter(r => r.debit !== 0 || r.credit !== 0);

    const totalDebit  = rows.reduce((s, r) => s + r.debit,  0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;

    return ok(res, { rows, totalDebit, totalCredit, isBalanced, asOfDate: asOfDate || new Date() });
  } catch (e) { return serverError(res, e); }
};

exports.saveTrialBalanceSnapshot = async (req, res) => {
  try {
    const { fiscalYear, period, asOfDate } = req.body;
    if (!fiscalYear || !asOfDate) return fail(res, 'fiscalYear and asOfDate are required');

    const q = { isDeleted: false, fiscalYear };
    if (period) q.period = period;
    q.entryDate = { $lte: new Date(asOfDate) };

    const entries = await GeneralLedger.find(q).lean();
    const accountMap = {};
    entries.forEach(e => {
      const id = String(e.account);
      if (!accountMap[id]) accountMap[id] = { account: e.account, debit: 0, credit: 0 };
      accountMap[id].debit  += e.debit;
      accountMap[id].credit += e.credit;
    });

    const accountIds = Object.keys(accountMap);
    const accounts = await ChartOfAccount.find({ _id: { $in: accountIds } }, 'accountCode accountName accountType').lean();
    const accIndex = {};
    accounts.forEach(a => { accIndex[String(a._id)] = a; });

    const snapshotEntries = accountIds.map(id => ({
      account:     id,
      accountCode: accIndex[id]?.accountCode || '',
      accountName: accIndex[id]?.accountName || '',
      accountType: accIndex[id]?.accountType || '',
      debit:       accountMap[id].debit,
      credit:      accountMap[id].credit,
    }));

    const totalDebit  = snapshotEntries.reduce((s, r) => s + r.debit,  0);
    const totalCredit = snapshotEntries.reduce((s, r) => s + r.credit, 0);

    const snap = await TrialBalanceSnapshot.create({
      fiscalYear, period, asOfDate: new Date(asOfDate),
      totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      entries: snapshotEntries, generatedBy: req.admin._id,
    });

    const io = req.app.locals.io;
    if (io) io.emit('finance:trial_balance_generated', { snapshotId: snap._id });

    return created(res, snap, 'Trial balance snapshot saved');
  } catch (e) { return serverError(res, e); }
};

// ── Balance Sheet ─────────────────────────────────────────────────────────────

exports.getBalanceSheet = async (req, res) => {
  try {
    const { fiscalYear, asOfDate } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    if (asOfDate)   q.entryDate  = { $lte: new Date(asOfDate) };

    const entries = await GeneralLedger.find(q).lean();
    const accountMap = {};
    entries.forEach(e => {
      const id = String(e.account);
      if (!accountMap[id]) accountMap[id] = { account: e.account, debit: 0, credit: 0 };
      accountMap[id].debit  += e.debit;
      accountMap[id].credit += e.credit;
    });

    const accountIds = Object.keys(accountMap);
    const accounts = await ChartOfAccount.find({ _id: { $in: accountIds } }, 'accountCode accountName accountType accountNature').lean();
    const accIndex = {};
    accounts.forEach(a => { accIndex[String(a._id)] = a; });

    const assets = [], liabilities = [], equity = [];
    accountIds.forEach(id => {
      const acc = accIndex[id];
      if (!acc) return;
      const balance = accountMap[id].debit - accountMap[id].credit;
      const row = { ...acc, balance };
      if (acc.accountType === 'asset')     assets.push(row);
      else if (acc.accountType === 'liability') liabilities.push(row);
      else if (acc.accountType === 'equity')    equity.push(row);
    });

    const totalAssets      = assets.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0);
    const totalEquity      = equity.reduce((s, r) => s + r.balance, 0);

    return ok(res, { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 });
  } catch (e) { return serverError(res, e); }
};

// ── Profit & Loss ─────────────────────────────────────────────────────────────

exports.getProfitAndLoss = async (req, res) => {
  try {
    const { fiscalYear, period, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    if (period)     q.period     = period;
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }

    const entries = await GeneralLedger.find(q).lean();
    const accountMap = {};
    entries.forEach(e => {
      const id = String(e.account);
      if (!accountMap[id]) accountMap[id] = { account: e.account, debit: 0, credit: 0 };
      accountMap[id].debit  += e.debit;
      accountMap[id].credit += e.credit;
    });

    const accountIds = Object.keys(accountMap);
    const accounts = await ChartOfAccount.find({ _id: { $in: accountIds }, accountType: { $in: ['revenue','expense'] } }, 'accountCode accountName accountType').lean();
    const accIndex = {};
    accounts.forEach(a => { accIndex[String(a._id)] = a; });

    const revenues = [], expenses = [];
    accountIds.forEach(id => {
      const acc = accIndex[id];
      if (!acc) return;
      const balance = accountMap[id].credit - accountMap[id].debit;
      const row = { ...acc, balance };
      if (acc.accountType === 'revenue') revenues.push(row);
      else if (acc.accountType === 'expense') expenses.push(row);
    });

    const totalRevenue  = revenues.reduce((s, r) => s + r.balance, 0);
    const totalExpense  = expenses.reduce((s, r) => s + r.balance, 0);
    const netProfit     = totalRevenue - totalExpense;

    return ok(res, { revenues, expenses, totalRevenue, totalExpense, netProfit });
  } catch (e) { return serverError(res, e); }
};

// ── Cash Book ─────────────────────────────────────────────────────────────────

exports.getCashBook = async (req, res) => {
  try {
    const { accountId, startDate, endDate, page = 1, limit = 50 } = req.query;
    if (!accountId) return fail(res, 'accountId is required');
    const q = { account: accountId, isDeleted: false };
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const entries = await GeneralLedger.find(q).populate('journalEntry','journalNumber narration').sort({ entryDate: 1 }).skip((page - 1) * limit).limit(Number(limit)).lean();
    const total = await GeneralLedger.countDocuments(q);
    let runningBalance = 0;
    const rows = entries.map(e => { runningBalance += e.debit - e.credit; return { ...e, runningBalance }; });
    const totalDebit  = entries.reduce((s, e) => s + e.debit,  0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    return ok(res, { rows, totalDebit, totalCredit, closingBalance: runningBalance, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return serverError(res, e); }
};

// ── Bank Book ─────────────────────────────────────────────────────────────────

exports.getBankBook = async (req, res) => {
  try {
    const { accountId, startDate, endDate, page = 1, limit = 50 } = req.query;
    if (!accountId) return fail(res, 'accountId is required');
    const q = { account: accountId, isDeleted: false };
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const entries = await GeneralLedger.find(q).populate('journalEntry','journalNumber narration').sort({ entryDate: 1 }).skip((page - 1) * limit).limit(Number(limit)).lean();
    const total = await GeneralLedger.countDocuments(q);
    let runningBalance = 0;
    const rows = entries.map(e => { runningBalance += e.debit - e.credit; return { ...e, runningBalance }; });
    const totalDebit  = entries.reduce((s, e) => s + e.debit,  0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    return ok(res, { rows, totalDebit, totalCredit, closingBalance: runningBalance, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return serverError(res, e); }
};

// ── Journal Book ──────────────────────────────────────────────────────────────

exports.getJournalBook = async (req, res) => {
  try {
    const { startDate, endDate, journalType, page = 1, limit = 50 } = req.query;
    const q = { isDeleted: false, status: 'posted' };
    if (journalType) q.journalType = journalType;
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      JournalEntry.find(q).sort({ entryDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      JournalEntry.countDocuments(q),
    ]);
    return ok(res, { data, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return serverError(res, e); }
};

// ── Day Book ──────────────────────────────────────────────────────────────────

exports.getDayBook = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return fail(res, 'date is required');
    const start = new Date(date); start.setHours(0,0,0,0);
    const end   = new Date(date); end.setHours(23,59,59,999);
    const journals = await JournalEntry.find({ isDeleted: false, entryDate: { $gte: start, $lte: end } }).lean();
    const journalIds = journals.map(j => j._id);
    const lines = await JournalLine.find({ journalEntry: { $in: journalIds }, isDeleted: false }).populate('account','accountCode accountName').lean();
    const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    return ok(res, { journals, lines, totalDebit, totalCredit, date });
  } catch (e) { return serverError(res, e); }
};
