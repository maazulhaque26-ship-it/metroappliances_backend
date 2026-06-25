const CashAccount     = require('../models/CashAccount');
const CashTransaction = require('../models/CashTransaction');
const PettyCash       = require('../models/PettyCash');
const PettyCashVoucher= require('../models/PettyCashVoucher');
const CashTransfer    = require('../models/CashTransfer');
const JournalEntry    = require('../models/JournalEntry');
const JournalLine     = require('../models/JournalLine');
const AuditLog        = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Cash Accounts ─────────────────────────────────────────────────────────────

exports.getCashAccounts = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.isActive !== undefined) q.isActive = req.query.isActive === 'true';
    const data = await CashAccount.find(q).sort({ accountName: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createCashAccount = async (req, res) => {
  try {
    const doc = await CashAccount.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'CASH_ACCOUNT_CREATED', entity: 'CashAccount', entityId: doc._id, entityLabel: doc.accountName, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Cash account created');
  } catch (e) { return serverError(res, e); }
};

exports.updateCashAccount = async (req, res) => {
  try {
    const doc = await CashAccount.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Cash account');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Cash Transactions ─────────────────────────────────────────────────────────

exports.getCashTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, cashAccount, transactionType, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (cashAccount)     q.cashAccount     = cashAccount;
    if (transactionType) q.transactionType = transactionType;
    if (startDate || endDate) {
      q.transactionDate = {};
      if (startDate) q.transactionDate.$gte = new Date(startDate);
      if (endDate)   q.transactionDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      CashTransaction.find(q).sort({ transactionDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('cashAccount', 'accountName'),
      CashTransaction.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createCashTransaction = async (req, res) => {
  try {
    const doc = await CashTransaction.create(req.body);
    const account = await CashAccount.findById(doc.cashAccount);
    if (account) {
      const delta = ['receipt','transfer_in'].includes(doc.transactionType) ? doc.amount : -doc.amount;
      account.currentBalance = (account.currentBalance || 0) + delta;
      await account.save();
    }
    return created(res, doc, 'Cash transaction recorded');
  } catch (e) { return serverError(res, e); }
};

// ── Cash Transfers ────────────────────────────────────────────────────────────

exports.getCashTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      CashTransfer.find(q).sort({ transferDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('fromAccount', 'accountName').populate('toAccount', 'accountName')
        .populate('fromCashAccount', 'accountName').populate('toCashAccount', 'accountName'),
      CashTransfer.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createCashTransfer = async (req, res) => {
  try {
    const doc = await CashTransfer.create({ ...req.body, status: 'pending' });
    const io = req.app.locals.io;
    if (io) io.emit('bank:cash_transfer', { transferNumber: doc.transferNumber, amount: doc.amount, type: doc.transferType });
    return created(res, doc, 'Transfer initiated');
  } catch (e) { return serverError(res, e); }
};

exports.completeTransfer = async (req, res) => {
  try {
    const doc = await CashTransfer.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Transfer');
    if (doc.status !== 'pending') return fail(res, 'Transfer is not pending');
    doc.status = 'completed';
    await doc.save();
    return ok(res, doc, 'Transfer completed');
  } catch (e) { return serverError(res, e); }
};

// ── Petty Cash Funds ──────────────────────────────────────────────────────────

exports.getPettyCashFunds = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.status) q.status = req.query.status;
    const data = await PettyCash.find(q).sort({ fundName: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createPettyCashFund = async (req, res) => {
  try {
    const doc = await PettyCash.create({ ...req.body, currentBalance: req.body.floatAmount || 0 });
    return created(res, doc, 'Petty cash fund created');
  } catch (e) { return serverError(res, e); }
};

exports.updatePettyCashFund = async (req, res) => {
  try {
    const doc = await PettyCash.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Petty cash fund');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Petty Cash Vouchers ───────────────────────────────────────────────────────

exports.getVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 20, pettyCash, status } = req.query;
    const q = { isDeleted: false };
    if (pettyCash) q.pettyCash = pettyCash;
    if (status)    q.status    = status;
    const [data, total] = await Promise.all([
      PettyCashVoucher.find(q).sort({ voucherDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('pettyCash', 'fundName'),
      PettyCashVoucher.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createVoucher = async (req, res) => {
  try {
    const doc = await PettyCashVoucher.create(req.body);
    return created(res, doc, 'Petty cash voucher created');
  } catch (e) { return serverError(res, e); }
};

exports.approveVoucher = async (req, res) => {
  try {
    const doc = await PettyCashVoucher.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Voucher');
    if (doc.status !== 'draft') return fail(res, 'Only draft vouchers can be approved');
    doc.status     = 'approved';
    doc.approvedBy = req.user.name;
    await doc.save();

    const fund = await PettyCash.findById(doc.pettyCash);
    if (fund) {
      fund.currentBalance = (fund.currentBalance || 0) - doc.amount;
      await fund.save();
    }
    return ok(res, doc, 'Voucher approved and paid');
  } catch (e) { return serverError(res, e); }
};

exports.replenishFund = async (req, res) => {
  try {
    const fund = await PettyCash.findOne({ _id: req.params.id, isDeleted: false });
    if (!fund) return notFound(res, 'Petty cash fund');
    const { amount } = req.body;
    fund.currentBalance = (fund.currentBalance || 0) + Number(amount);
    await fund.save();
    return ok(res, fund, `Fund replenished by ₹${amount}`);
  } catch (e) { return serverError(res, e); }
};
