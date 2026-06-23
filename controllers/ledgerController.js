const GeneralLedger  = require('../models/GeneralLedger');
const LedgerBalance  = require('../models/LedgerBalance');
const ChartOfAccount = require('../models/ChartOfAccount');
const { paginated, ok, notFound, serverError } = require('../utils/response');

exports.getLedgerEntries = async (req, res) => {
  try {
    const { page = 1, limit = 50, account, fiscalYear, period, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (account)    q.account    = account;
    if (fiscalYear) q.fiscalYear = fiscalYear;
    if (period)     q.period     = period;
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      GeneralLedger.find(q)
        .populate('account',      'accountCode accountName accountType')
        .populate('journalEntry', 'journalNumber journalType')
        .sort({ entryDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      GeneralLedger.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getAccountStatement = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, fiscalYear } = req.query;
    const account = await ChartOfAccount.findOne({ _id: accountId, isDeleted: false });
    if (!account) return notFound(res, 'Account');

    const q = { account: accountId, isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const entries = await GeneralLedger.find(q)
      .populate('journalEntry', 'journalNumber narration')
      .sort({ entryDate: 1, createdAt: 1 });

    let runningBalance = 0;
    const lines = entries.map(e => {
      runningBalance += (e.debit - e.credit);
      return { ...e.toObject(), runningBalance };
    });

    const totalDebit  = entries.reduce((s, e) => s + e.debit,  0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

    return ok(res, { account, entries: lines, totalDebit, totalCredit, closingBalance: runningBalance });
  } catch (e) { return serverError(res, e); }
};

exports.getLedgerBalances = async (req, res) => {
  try {
    const { page = 1, limit = 50, fiscalYear, period } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    if (period)     q.period     = period;
    const [data, total] = await Promise.all([
      LedgerBalance.find(q).populate('account','accountCode accountName accountType').sort({ 'account.accountCode': 1 }).skip((page - 1) * limit).limit(Number(limit)),
      LedgerBalance.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};
