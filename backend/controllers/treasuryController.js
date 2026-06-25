const TreasuryPosition = require('../models/TreasuryPosition');
const CashForecast     = require('../models/CashForecast');
const LiquidityForecast= require('../models/LiquidityForecast');
const BankGuarantee    = require('../models/BankGuarantee');
const LetterOfCredit   = require('../models/LetterOfCredit');
const TreasurySetting  = require('../models/TreasurySetting');
const PaymentGateway   = require('../models/PaymentGateway');
const PaymentGatewayTransaction = require('../models/PaymentGatewayTransaction');
const BankAccount      = require('../models/BankAccount');
const CashAccount      = require('../models/CashAccount');
const AuditLog         = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Treasury Position ─────────────────────────────────────────────────────────

exports.getTreasuryPositions = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (startDate || endDate) {
      q.positionDate = {};
      if (startDate) q.positionDate.$gte = new Date(startDate);
      if (endDate)   q.positionDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      TreasuryPosition.find(q).sort({ positionDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      TreasuryPosition.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createTreasuryPosition = async (req, res) => {
  try {
    const [bankAccounts, cashAccounts] = await Promise.all([
      BankAccount.find({ isActive: true, isDeleted: false }),
      CashAccount.find({ isActive: true, isDeleted: false }),
    ]);
    const bankBalance = bankAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
    const cashBalance = cashAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
    const doc = await TreasuryPosition.create({
      ...req.body,
      bankBalance: req.body.bankBalance ?? bankBalance,
      cashBalance: req.body.cashBalance ?? cashBalance,
      totalAssets: (req.body.bankBalance ?? bankBalance) + (req.body.cashBalance ?? cashBalance) + (req.body.investmentBalance || 0) + (req.body.fdBalance || 0),
      netPosition: (req.body.bankBalance ?? bankBalance) + (req.body.cashBalance ?? cashBalance) - (req.body.overdraftUsed || 0),
    });
    const io = req.app.locals.io;
    if (io) io.emit('bank:forecast_updated', { positionDate: doc.positionDate, netPosition: doc.netPosition });
    return created(res, doc, 'Treasury position captured');
  } catch (e) { return serverError(res, e); }
};

// ── Cash Forecasts ────────────────────────────────────────────────────────────

exports.getCashForecasts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      CashForecast.find(q).sort({ forecastDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      CashForecast.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createCashForecast = async (req, res) => {
  try {
    const { expectedReceipts = 0, expectedPayments = 0, openingBalance = 0 } = req.body;
    const netCashFlow     = Number(expectedReceipts) - Number(expectedPayments);
    const closingForecast = Number(openingBalance) + netCashFlow;
    const doc = await CashForecast.create({ ...req.body, netCashFlow, closingForecast });
    return created(res, doc, 'Cash forecast created');
  } catch (e) { return serverError(res, e); }
};

exports.updateCashForecast = async (req, res) => {
  try {
    const { actualReceipts, actualPayments, openingBalance } = req.body;
    const update = { ...req.body };
    if (actualReceipts !== undefined && actualPayments !== undefined) {
      update.variance     = (Number(actualReceipts) - Number(actualPayments)) - ((req.body.expectedReceipts || 0) - (req.body.expectedPayments || 0));
      update.actualClosing = Number(openingBalance || 0) + Number(actualReceipts) - Number(actualPayments);
    }
    const doc = await CashForecast.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, update, { new: true });
    if (!doc) return notFound(res, 'Cash forecast');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteCashForecast = async (req, res) => {
  try {
    const doc = await CashForecast.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Cash forecast');
    return noContent(res, 'Forecast deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Liquidity Forecast ────────────────────────────────────────────────────────

exports.getLiquidityForecasts = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.horizon) q.horizon = req.query.horizon;
    const data = await LiquidityForecast.find(q).sort({ forecastDate: -1 }).limit(50);
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createLiquidityForecast = async (req, res) => {
  try {
    const { items = [], openingBalance = 0 } = req.body;
    let running = Number(openingBalance);
    let totalInflow = 0, totalOutflow = 0;
    const enriched = items.map(item => {
      const inflow  = Number(item.inflow  || 0);
      const outflow = Number(item.outflow || 0);
      const net     = inflow - outflow;
      running       += net;
      totalInflow   += inflow;
      totalOutflow  += outflow;
      return { ...item, netFlow: net, cumulativeBalance: running };
    });
    const doc = await LiquidityForecast.create({ ...req.body, items: enriched, totalInflow, totalOutflow, closingBalance: running });
    return created(res, doc, 'Liquidity forecast created');
  } catch (e) { return serverError(res, e); }
};

// ── Bank Guarantees ───────────────────────────────────────────────────────────

exports.getBankGuarantees = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, bankAccount } = req.query;
    const q = { isDeleted: false };
    if (status)      q.status      = status;
    if (bankAccount) q.bankAccount = bankAccount;
    const [data, total] = await Promise.all([
      BankGuarantee.find(q).sort({ issueDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      BankGuarantee.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getBankGuarantee = async (req, res) => {
  try {
    const doc = await BankGuarantee.findOne({ _id: req.params.id, isDeleted: false }).populate('bankAccount', 'accountName accountNumber');
    if (!doc) return notFound(res, 'Bank guarantee');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createBankGuarantee = async (req, res) => {
  try {
    const doc = await BankGuarantee.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'BG_CREATED', entity: 'BankGuarantee', entityId: doc._id, entityLabel: doc.bgNumber, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Bank guarantee created');
  } catch (e) { return serverError(res, e); }
};

exports.updateBankGuarantee = async (req, res) => {
  try {
    const doc = await BankGuarantee.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Bank guarantee');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteBankGuarantee = async (req, res) => {
  try {
    const doc = await BankGuarantee.findOneAndUpdate({ _id: req.params.id, isDeleted: false, status: { $in: ['draft','cancelled','expired'] } }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Bank guarantee (draft/cancelled/expired only)');
    return noContent(res, 'Bank guarantee deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Letters of Credit ─────────────────────────────────────────────────────────

exports.getLettersOfCredit = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, lcType } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    if (lcType) q.lcType = lcType;
    const [data, total] = await Promise.all([
      LetterOfCredit.find(q).sort({ issueDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      LetterOfCredit.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getLetterOfCredit = async (req, res) => {
  try {
    const doc = await LetterOfCredit.findOne({ _id: req.params.id, isDeleted: false }).populate('bankAccount', 'accountName accountNumber');
    if (!doc) return notFound(res, 'Letter of credit');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createLetterOfCredit = async (req, res) => {
  try {
    const doc = await LetterOfCredit.create({ ...req.body, outstandingAmount: req.body.amount || 0 });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'LC_CREATED', entity: 'LetterOfCredit', entityId: doc._id, entityLabel: doc.lcNumber, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'LC created');
  } catch (e) { return serverError(res, e); }
};

exports.updateLetterOfCredit = async (req, res) => {
  try {
    const doc = await LetterOfCredit.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Letter of credit');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteLetterOfCredit = async (req, res) => {
  try {
    const doc = await LetterOfCredit.findOneAndUpdate({ _id: req.params.id, isDeleted: false, status: { $in: ['draft','cancelled','expired'] } }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Letter of credit (draft/cancelled/expired only)');
    return noContent(res, 'Letter of credit deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Treasury Settings ─────────────────────────────────────────────────────────

exports.getSettings = async (req, res) => {
  try {
    const data = await TreasurySetting.find({ isDeleted: false }).sort({ category: 1, key: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.upsertSetting = async (req, res) => {
  try {
    const doc = await TreasurySetting.findOneAndUpdate({ key: req.params.key }, { $set: { value: req.body.value, description: req.body.description, category: req.body.category } }, { upsert: true, new: true });
    return ok(res, doc, 'Setting updated');
  } catch (e) { return serverError(res, e); }
};

// ── Payment Gateways ──────────────────────────────────────────────────────────

exports.getGateways = async (req, res) => {
  try {
    const data = await PaymentGateway.find({ isDeleted: false }).sort({ gatewayName: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createGateway = async (req, res) => {
  try {
    const doc = await PaymentGateway.create(req.body);
    return created(res, doc, 'Payment gateway created');
  } catch (e) { return serverError(res, e); }
};

exports.updateGateway = async (req, res) => {
  try {
    const doc = await PaymentGateway.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Payment gateway');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.getGatewayTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, paymentGateway, status } = req.query;
    const q = { isDeleted: false };
    if (paymentGateway) q.paymentGateway = paymentGateway;
    if (status)         q.status         = status;
    const [data, total] = await Promise.all([
      PaymentGatewayTransaction.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('paymentGateway', 'gatewayName provider'),
      PaymentGatewayTransaction.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createGatewayTransaction = async (req, res) => {
  try {
    const doc = await PaymentGatewayTransaction.create(req.body);
    return created(res, doc, 'Gateway transaction recorded');
  } catch (e) { return serverError(res, e); }
};
