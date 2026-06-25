const FXTransaction  = require('../models/FXTransaction');
const FXGainLoss     = require('../models/FXGainLoss');
const CurrencyAccount= require('../models/CurrencyAccount');
const ExchangeRate   = require('../models/ExchangeRate');
const JournalEntry   = require('../models/JournalEntry');
const JournalLine    = require('../models/JournalLine');
const AuditLog       = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Exchange Rates (reuse existing model) ─────────────────────────────────────

exports.getExchangeRates = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.fromCurrency) q.fromCurrency = req.query.fromCurrency;
    if (req.query.toCurrency)   q.toCurrency   = req.query.toCurrency;
    if (req.query.isActive !== undefined) q.isActive = req.query.isActive === 'true';
    const data = await ExchangeRate.find(q).sort({ effectiveDate: -1 }).limit(200);
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createExchangeRate = async (req, res) => {
  try {
    const doc = await ExchangeRate.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('bank:fx_updated', { fromCurrency: doc.fromCurrency, toCurrency: doc.toCurrency, rate: doc.rate });
    return created(res, doc, 'Exchange rate added');
  } catch (e) { return serverError(res, e); }
};

exports.updateExchangeRate = async (req, res) => {
  try {
    const doc = await ExchangeRate.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Exchange rate');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteExchangeRate = async (req, res) => {
  try {
    const doc = await ExchangeRate.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Exchange rate');
    return noContent(res, 'Exchange rate deleted');
  } catch (e) { return serverError(res, e); }
};

// ── FX Transactions ───────────────────────────────────────────────────────────

exports.getFXTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, fromCurrency, toCurrency } = req.query;
    const q = { isDeleted: false };
    if (status)       q.status       = status;
    if (fromCurrency) q.fromCurrency = fromCurrency;
    if (toCurrency)   q.toCurrency   = toCurrency;
    const [data, total] = await Promise.all([
      FXTransaction.find(q).sort({ transactionDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName').populate('currencyAccount', 'accountName currency'),
      FXTransaction.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createFXTransaction = async (req, res) => {
  try {
    const { fromAmount, exchangeRate, bankRate } = req.body;
    const toAmount = Math.round(Number(fromAmount) * Number(exchangeRate) * 100) / 100;
    const spread   = bankRate ? Math.abs(Number(bankRate) - Number(exchangeRate)) : 0;
    const doc      = await FXTransaction.create({ ...req.body, toAmount, spread });
    const io = req.app.locals.io;
    if (io) io.emit('bank:fx_updated', { transactionNumber: doc.transactionNumber, fromCurrency: doc.fromCurrency, toCurrency: doc.toCurrency });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'FX_TRANSACTION_CREATED', entity: 'FXTransaction', entityId: doc._id, entityLabel: doc.transactionNumber, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'FX transaction created');
  } catch (e) { return serverError(res, e); }
};

exports.updateFXTransaction = async (req, res) => {
  try {
    const doc = await FXTransaction.findOneAndUpdate({ _id: req.params.id, isDeleted: false, status: { $ne: 'settled' } }, req.body, { new: true });
    if (!doc) return notFound(res, 'FX transaction (settled cannot be edited)');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.settleFXTransaction = async (req, res) => {
  try {
    const doc = await FXTransaction.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'FX transaction');
    if (doc.status !== 'confirmed') return fail(res, 'Only confirmed FX transactions can be settled');
    const gainLoss = req.body.gainLossAmount || 0;
    doc.status          = 'settled';
    doc.gainLossAmount  = gainLoss;
    await doc.save();
    if (gainLoss !== 0) {
      await FXGainLoss.create({ postingDate: new Date(), currency: doc.fromCurrency, bookRate: doc.exchangeRate, currentRate: doc.bankRate || doc.exchangeRate, gainLossAmount: gainLoss, gainLossType: 'realized', fxTransaction: doc._id, sourceModule: 'banking', sourceId: doc._id });
    }
    return ok(res, doc, 'FX transaction settled');
  } catch (e) { return serverError(res, e); }
};

exports.deleteFXTransaction = async (req, res) => {
  try {
    const doc = await FXTransaction.findOneAndUpdate({ _id: req.params.id, isDeleted: false, status: 'draft' }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'FX transaction (draft only)');
    return noContent(res, 'FX transaction deleted');
  } catch (e) { return serverError(res, e); }
};

// ── FX Gain/Loss ──────────────────────────────────────────────────────────────

exports.getFXGainLoss = async (req, res) => {
  try {
    const { page = 1, limit = 20, currency, gainLossType } = req.query;
    const q = { isDeleted: false };
    if (currency)     q.currency     = currency;
    if (gainLossType) q.gainLossType = gainLossType;
    const [data, total] = await Promise.all([
      FXGainLoss.find(q).sort({ postingDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      FXGainLoss.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

// ── Currency Accounts ─────────────────────────────────────────────────────────

exports.getCurrencyAccounts = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.currency) q.currency = req.query.currency;
    const data = await CurrencyAccount.find(q).sort({ currency: 1 }).populate('bankAccount', 'accountName');
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createCurrencyAccount = async (req, res) => {
  try {
    const doc = await CurrencyAccount.create(req.body);
    return created(res, doc, 'Currency account created');
  } catch (e) { return serverError(res, e); }
};

exports.updateCurrencyAccount = async (req, res) => {
  try {
    const doc = await CurrencyAccount.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Currency account');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.revalueCurrencyAccount = async (req, res) => {
  try {
    const account     = await CurrencyAccount.findOne({ _id: req.params.id, isDeleted: false });
    if (!account) return notFound(res, 'Currency account');
    const { newRate } = req.body;
    const newBalanceINR  = account.currentBalance * Number(newRate);
    const unrealized     = newBalanceINR - account.currentBalanceINR;
    account.currentRate  = newRate;
    account.currentBalanceINR    = newBalanceINR;
    account.unrealizedGainLoss   = unrealized;
    await account.save();
    if (unrealized !== 0) {
      await FXGainLoss.create({ postingDate: new Date(), currency: account.currency, bookRate: account.currentRate, currentRate: newRate, openingBalance: account.currentBalance, gainLossAmount: unrealized, gainLossType: 'unrealized', currencyAccount: account._id, sourceModule: 'banking', sourceId: account._id });
    }
    return ok(res, account, 'Account revalued');
  } catch (e) { return serverError(res, e); }
};
