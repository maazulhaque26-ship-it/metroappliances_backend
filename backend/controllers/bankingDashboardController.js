const BankAccount        = require('../models/BankAccount');
const BankTransaction    = require('../models/BankTransaction');
const BankReconciliation = require('../models/BankReconciliation');
const CashAccount        = require('../models/CashAccount');
const Investment         = require('../models/Investment');
const FixedDeposit       = require('../models/FixedDeposit');
const CashForecast       = require('../models/CashForecast');
const TreasuryPosition   = require('../models/TreasuryPosition');
const BankGuarantee      = require('../models/BankGuarantee');
const LetterOfCredit     = require('../models/LetterOfCredit');
const { ok, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(today); todayEnd.setHours(23,59,59,999);

    const [
      bankAccounts,
      cashAccounts,
      todayReceipts,
      todayPayments,
      unreconciled,
      investments,
      activeInvestments,
      activeFDs,
      activeBGs,
      activeLCs,
      latestForecast,
      treasuryPosition,
      recentTransactions,
      monthlyFlow,
    ] = await Promise.all([
      BankAccount.find({ isActive: true, isDeleted: false }),
      CashAccount.find({ isActive: true, isDeleted: false }),
      BankTransaction.aggregate([
        { $match: { transactionType: 'receipt', transactionDate: { $gte: todayStart, $lte: todayEnd }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      BankTransaction.aggregate([
        { $match: { transactionType: 'payment', transactionDate: { $gte: todayStart, $lte: todayEnd }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      BankTransaction.countDocuments({ isReconciled: false, isDeleted: false }),
      Investment.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', total: { $sum: '$currentValue' }, count: { $sum: 1 } } },
      ]),
      Investment.countDocuments({ status: 'active', isDeleted: false }),
      FixedDeposit.countDocuments({ status: 'active', isDeleted: false }),
      BankGuarantee.countDocuments({ status: 'active', isDeleted: false }),
      LetterOfCredit.countDocuments({ status: 'active', isDeleted: false }),
      CashForecast.findOne({ isDeleted: false }).sort({ forecastDate: -1 }),
      TreasuryPosition.findOne({ isDeleted: false }).sort({ positionDate: -1 }),
      BankTransaction.find({ isDeleted: false }).sort({ transactionDate: -1 }).limit(10)
        .populate('bankAccount', 'accountName accountNumber'),
      BankTransaction.aggregate([
        { $match: { isDeleted: false, transactionDate: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) } } },
        { $group: {
          _id: { year: { $year: '$transactionDate' }, month: { $month: '$transactionDate' }, type: '$transactionType' },
          total: { $sum: '$amount' },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const totalBankBalance = bankAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
    const totalCashBalance = cashAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
    const totalInvestment  = investments.find(i => i._id === 'active')?.total || 0;

    return ok(res, {
      metrics: {
        totalBankBalance,
        totalCashBalance,
        totalLiquidity: totalBankBalance + totalCashBalance,
        totalInvestment,
        todayReceipts: todayReceipts[0]?.total || 0,
        todayPayments: todayPayments[0]?.total || 0,
        unreconciledCount: unreconciled,
        activeInvestments,
        activeFDs,
        activeBGs,
        activeLCs,
      },
      bankAccounts,
      cashAccounts,
      treasuryPosition,
      latestForecast,
      recentTransactions,
      monthlyFlow,
      investmentSummary: investments,
    });
  } catch (e) { return serverError(res, e); }
};

exports.getComplianceStatus = async (req, res) => {
  try {
    const today = new Date();
    const in30days = new Date(today.getTime() + 30 * 86400000);

    const [expiredBGs, expiringBGs, expiredLCs, expiringLCs, maturingFDs] = await Promise.all([
      BankGuarantee.countDocuments({ expiryDate: { $lt: today }, status: 'active', isDeleted: false }),
      BankGuarantee.countDocuments({ expiryDate: { $gte: today, $lte: in30days }, status: 'active', isDeleted: false }),
      LetterOfCredit.countDocuments({ expiryDate: { $lt: today }, status: 'active', isDeleted: false }),
      LetterOfCredit.countDocuments({ expiryDate: { $gte: today, $lte: in30days }, status: 'active', isDeleted: false }),
      FixedDeposit.find({ maturityDate: { $gte: today, $lte: in30days }, status: 'active', isDeleted: false })
        .select('fdNumber maturityDate maturityAmount bankAccount').populate('bankAccount', 'accountName'),
    ]);

    return ok(res, { expiredBGs, expiringBGs, expiredLCs, expiringLCs, maturingFDs });
  } catch (e) { return serverError(res, e); }
};
