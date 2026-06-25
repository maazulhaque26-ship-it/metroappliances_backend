const JournalEntry    = require('../models/JournalEntry');
const GeneralLedger   = require('../models/GeneralLedger');
const ChartOfAccount  = require('../models/ChartOfAccount');
const FiscalYear      = require('../models/FiscalYear');
const AccountingPeriod= require('../models/AccountingPeriod');
const Voucher         = require('../models/Voucher');
const { ok, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 3, 1); // April 1
    if (now < startOfYear) startOfYear.setFullYear(now.getFullYear() - 1);

    const [
      totalJournals,
      postedJournals,
      draftJournals,
      totalAccounts,
      activeAccounts,
      openFiscalYears,
      recentJournals,
      totalVouchers,
      monthlyActivity,
    ] = await Promise.all([
      JournalEntry.countDocuments({ isDeleted: false }),
      JournalEntry.countDocuments({ isDeleted: false, status: 'posted' }),
      JournalEntry.countDocuments({ isDeleted: false, status: 'draft' }),
      ChartOfAccount.countDocuments({ isDeleted: false }),
      ChartOfAccount.countDocuments({ isDeleted: false, isActive: true }),
      FiscalYear.countDocuments({ isDeleted: false, status: 'open' }),
      JournalEntry.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(10).lean(),
      Voucher.countDocuments({ isDeleted: false }),
      JournalEntry.aggregate([
        { $match: { isDeleted: false, status: 'posted', entryDate: { $gte: startOfYear } } },
        { $group: { _id: { year: { $year: '$entryDate' }, month: { $month: '$entryDate' } }, count: { $sum: 1 }, totalDebit: { $sum: '$totalDebit' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    return ok(res, {
      kpis: { totalJournals, postedJournals, draftJournals, totalAccounts, activeAccounts, openFiscalYears, totalVouchers },
      recentJournals,
      monthlyActivity,
    });
  } catch (e) { return serverError(res, e); }
};

exports.getAccountTypeBreakdown = async (req, res) => {
  try {
    const breakdown = await ChartOfAccount.aggregate([
      { $match: { isDeleted: false, isActive: true } },
      { $group: { _id: '$accountType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return ok(res, breakdown);
  } catch (e) { return serverError(res, e); }
};

exports.getTopAccounts = async (req, res) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const top = await GeneralLedger.aggregate([
      { $match: { isDeleted: false, entryDate: { $gte: since } } },
      { $group: { _id: '$account', totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' }, txCount: { $sum: 1 } } },
      { $sort: { txCount: -1 } },
      { $limit: Number(limit) },
      { $lookup: { from: 'chartofaccounts', localField: '_id', foreignField: '_id', as: 'account' } },
      { $unwind: { path: '$account', preserveNullAndEmpty: true } },
    ]);
    return ok(res, top);
  } catch (e) { return serverError(res, e); }
};
