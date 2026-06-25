const BankTransaction  = require('../models/BankTransaction');
const BankAccount      = require('../models/BankAccount');
const CashTransaction  = require('../models/CashTransaction');
const CashAccount      = require('../models/CashAccount');
const Investment       = require('../models/Investment');
const FixedDeposit     = require('../models/FixedDeposit');
const BankGuarantee    = require('../models/BankGuarantee');
const LetterOfCredit   = require('../models/LetterOfCredit');
const TreasuryPosition = require('../models/TreasuryPosition');
const CashForecast     = require('../models/CashForecast');
const FXTransaction    = require('../models/FXTransaction');
const FXGainLoss       = require('../models/FXGainLoss');
const BankCharge       = require('../models/BankCharge');
const InterestPosting  = require('../models/InterestPosting');
const { ok, serverError } = require('../utils/response');

exports.getBankBook = async (req, res) => {
  try {
    const { bankAccount, startDate, endDate } = req.query;
    if (!bankAccount) return ok(res, { transactions: [], summary: {} });
    const q = { bankAccount, isDeleted: false };
    if (startDate || endDate) {
      q.transactionDate = {};
      if (startDate) q.transactionDate.$gte = new Date(startDate);
      if (endDate)   q.transactionDate.$lte = new Date(endDate);
    }
    const [transactions, account] = await Promise.all([
      BankTransaction.find(q).sort({ transactionDate: 1, createdAt: 1 }),
      BankAccount.findById(bankAccount),
    ]);
    const summary = transactions.reduce((s, t) => {
      const isDebit = ['payment','transfer_out','bank_charge','interest_debit','cash_withdrawal'].includes(t.transactionType);
      if (isDebit) s.totalDebits += t.amount;
      else         s.totalCredits += t.amount;
      return s;
    }, { totalCredits: 0, totalDebits: 0 });
    return ok(res, { transactions, account, summary });
  } catch (e) { return serverError(res, e); }
};

exports.getCashBook = async (req, res) => {
  try {
    const { cashAccount, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (cashAccount) q.cashAccount = cashAccount;
    if (startDate || endDate) {
      q.transactionDate = {};
      if (startDate) q.transactionDate.$gte = new Date(startDate);
      if (endDate)   q.transactionDate.$lte = new Date(endDate);
    }
    const [transactions, accounts] = await Promise.all([
      CashTransaction.find(q).sort({ transactionDate: 1 }).populate('cashAccount', 'accountName'),
      cashAccount ? CashAccount.findById(cashAccount) : CashAccount.find({ isDeleted: false }),
    ]);
    const summary = transactions.reduce((s, t) => {
      if (['receipt','transfer_in'].includes(t.transactionType)) s.totalReceipts += t.amount;
      else s.totalPayments += t.amount;
      return s;
    }, { totalReceipts: 0, totalPayments: 0 });
    return ok(res, { transactions, accounts, summary });
  } catch (e) { return serverError(res, e); }
};

exports.getDailyCashPosition = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate); dayStart.setHours(0,0,0,0);
    const dayEnd   = new Date(targetDate); dayEnd.setHours(23,59,59,999);
    const [bankAccounts, cashAccounts, dayTxns] = await Promise.all([
      BankAccount.find({ isActive: true, isDeleted: false }),
      CashAccount.find({ isActive: true, isDeleted: false }),
      BankTransaction.aggregate([
        { $match: { transactionDate: { $gte: dayStart, $lte: dayEnd }, isDeleted: false } },
        { $group: { _id: '$transactionType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);
    return ok(res, {
      date: targetDate,
      bankBalance:  bankAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0),
      cashBalance:  cashAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0),
      bankAccounts,
      cashAccounts,
      dayTransactions: dayTxns,
    });
  } catch (e) { return serverError(res, e); }
};

exports.getTreasuryPositionReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (startDate || endDate) {
      q.positionDate = {};
      if (startDate) q.positionDate.$gte = new Date(startDate);
      if (endDate)   q.positionDate.$lte = new Date(endDate);
    }
    const positions = await TreasuryPosition.find(q).sort({ positionDate: -1 }).limit(90);
    return ok(res, { positions });
  } catch (e) { return serverError(res, e); }
};

exports.getInvestmentRegister = async (req, res) => {
  try {
    const { investmentType, status } = req.query;
    const q = { isDeleted: false };
    if (investmentType) q.investmentType = investmentType;
    if (status)         q.status         = status;
    const [investments, summary] = await Promise.all([
      Investment.find(q).sort({ purchaseDate: -1 }).populate('bankAccount', 'accountName'),
      Investment.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: { type: '$investmentType', status: '$status' }, count: { $sum: 1 }, totalPrincipal: { $sum: '$principalAmount' }, totalCurrent: { $sum: '$currentValue' } } },
      ]),
    ]);
    return ok(res, { investments, summary });
  } catch (e) { return serverError(res, e); }
};

exports.getFDRegister = async (req, res) => {
  try {
    const { status, bankAccount } = req.query;
    const q = { isDeleted: false };
    if (status)      q.status      = status;
    if (bankAccount) q.bankAccount = bankAccount;
    const [fds, summary] = await Promise.all([
      FixedDeposit.find(q).sort({ maturityDate: 1 }).populate('bankAccount', 'accountName accountNumber'),
      FixedDeposit.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalPrincipal: { $sum: '$principalAmount' }, totalMaturity: { $sum: '$maturityAmount' } } },
      ]),
    ]);
    return ok(res, { fds, summary });
  } catch (e) { return serverError(res, e); }
};

exports.getGuaranteeRegister = async (req, res) => {
  try {
    const { status, guaranteeType } = req.query;
    const q = { isDeleted: false };
    if (status)        q.status        = status;
    if (guaranteeType) q.guaranteeType = guaranteeType;
    const bgs = await BankGuarantee.find(q).sort({ expiryDate: 1 }).populate('bankAccount', 'accountName accountNumber');
    const summary = await BankGuarantee.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);
    return ok(res, { bgs, summary });
  } catch (e) { return serverError(res, e); }
};

exports.getCashFlowReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year || new Date().getFullYear());
    const monthlyFlow = await BankTransaction.aggregate([
      { $match: { isDeleted: false, transactionDate: { $gte: new Date(targetYear, 0, 1), $lte: new Date(targetYear, 11, 31) } } },
      { $group: {
        _id: { month: { $month: '$transactionDate' }, type: '$transactionType' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.month': 1 } },
    ]);
    return ok(res, { year: targetYear, monthlyFlow });
  } catch (e) { return serverError(res, e); }
};

exports.getForecastVsActual = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (startDate || endDate) {
      q.forecastDate = {};
      if (startDate) q.forecastDate.$gte = new Date(startDate);
      if (endDate)   q.forecastDate.$lte = new Date(endDate);
    }
    const forecasts = await CashForecast.find(q).sort({ forecastDate: 1 });
    return ok(res, { forecasts });
  } catch (e) { return serverError(res, e); }
};
