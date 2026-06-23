const BankAccount      = require('../models/BankAccount');
const BankTransaction  = require('../models/BankTransaction');
const BankStatement    = require('../models/BankStatement');
const BankStatementLine= require('../models/BankStatementLine');
const BankCharge       = require('../models/BankCharge');
const InterestPosting  = require('../models/InterestPosting');
const ElectronicPayment= require('../models/ElectronicPayment');
const ChequeBook       = require('../models/ChequeBook');
const Cheque           = require('../models/Cheque');
const JournalEntry     = require('../models/JournalEntry');
const JournalLine      = require('../models/JournalLine');
const AuditLog         = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Bank Accounts ─────────────────────────────────────────────────────────────

exports.getAccounts = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.bank)     q.bank     = req.query.bank;
    if (req.query.currency) q.currency = req.query.currency;
    if (req.query.isActive !== undefined) q.isActive = req.query.isActive === 'true';
    const data = await BankAccount.find(q).sort({ accountName: 1 }).populate('bank', 'bankName bankCode');
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.getAccount = async (req, res) => {
  try {
    const doc = await BankAccount.findOne({ _id: req.params.id, isDeleted: false }).populate('bank','bankName').populate('branch','branchName ifscCode');
    if (!doc) return notFound(res, 'Bank account');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createAccount = async (req, res) => {
  try {
    const doc = await BankAccount.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'BANK_ACCOUNT_CREATED', entity: 'BankAccount', entityId: doc._id, entityLabel: doc.accountName, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Bank account created');
  } catch (e) { return serverError(res, e); }
};

exports.updateAccount = async (req, res) => {
  try {
    const doc = await BankAccount.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Bank account');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Bank Transactions ─────────────────────────────────────────────────────────

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, bankAccount, transactionType, paymentMode, status, startDate, endDate, search = '' } = req.query;
    const q = { isDeleted: false };
    if (bankAccount)     q.bankAccount     = bankAccount;
    if (transactionType) q.transactionType = transactionType;
    if (paymentMode)     q.paymentMode     = paymentMode;
    if (status)          q.status          = status;
    if (search)          q.$or = [{ transactionNumber: { $regex: search, $options: 'i' } }, { partyName: { $regex: search, $options: 'i' } }, { narration: { $regex: search, $options: 'i' } }];
    if (startDate || endDate) {
      q.transactionDate = {};
      if (startDate) q.transactionDate.$gte = new Date(startDate);
      if (endDate)   q.transactionDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      BankTransaction.find(q).sort({ transactionDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      BankTransaction.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createTransaction = async (req, res) => {
  try {
    const { autoPost = false, glDebitAccount, glCreditAccount, narration: txNarration, ...txBody } = req.body;
    const doc = await BankTransaction.create(txBody);

    if (autoPost && glDebitAccount && glCreditAccount) {
      const je = await JournalEntry.create({
        journalType: 'automatic',
        entryDate:   doc.transactionDate,
        narration:   txNarration || `Bank transaction ${doc.transactionNumber}`,
        totalDebit:  doc.amount,
        totalCredit: doc.amount,
        sourceModule:'banking',
        sourceId:    doc._id,
        status:      'posted',
        postedAt:    new Date(),
        postedBy:    req.user._id,
        createdBy:   req.user._id,
      });
      const lines = await JournalLine.insertMany([
        { journalEntry: je._id, lineNumber: 1, account: glDebitAccount,  debit: doc.amount, credit: 0, narration: txNarration || doc.transactionNumber, isDeleted: false },
        { journalEntry: je._id, lineNumber: 2, account: glCreditAccount, debit: 0, credit: doc.amount, narration: txNarration || doc.transactionNumber, isDeleted: false },
      ]);
      await postJournalToLedger(je, lines);
      doc.journalEntry = je._id;
      await doc.save();
    }

    const account = await BankAccount.findById(doc.bankAccount);
    if (account) {
      const delta = ['receipt','transfer_in','interest_credit','cash_deposit','opening_balance'].includes(doc.transactionType) ? doc.amount : -doc.amount;
      account.currentBalance = (account.currentBalance || 0) + delta;
      await account.save();
    }

    const io = req.app.locals.io;
    if (io) io.emit('bank:transaction_posted', { transactionNumber: doc.transactionNumber, amount: doc.amount, type: doc.transactionType });

    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'BANK_TRANSACTION_CREATED', entity: 'BankTransaction', entityId: doc._id, entityLabel: doc.transactionNumber, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Transaction posted');
  } catch (e) { return serverError(res, e); }
};

exports.updateTransaction = async (req, res) => {
  try {
    const old = await BankTransaction.findOne({ _id: req.params.id, isDeleted: false });
    if (!old) return notFound(res, 'Transaction');
    if (old.status === 'reconciled') return fail(res, 'Cannot edit a reconciled transaction');
    const doc = await BankTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const doc = await BankTransaction.findOneAndUpdate({ _id: req.params.id, isDeleted: false, status: { $ne: 'reconciled' } }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Transaction (or already reconciled)');
    return noContent(res, 'Transaction deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Bank Statements ───────────────────────────────────────────────────────────

exports.getStatements = async (req, res) => {
  try {
    const { page = 1, limit = 20, bankAccount, status } = req.query;
    const q = { isDeleted: false };
    if (bankAccount) q.bankAccount = bankAccount;
    if (status)      q.status      = status;
    const [data, total] = await Promise.all([
      BankStatement.find(q).sort({ statementDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      BankStatement.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createStatement = async (req, res) => {
  try {
    const { lines = [], ...stmtBody } = req.body;
    const doc = await BankStatement.create({ ...stmtBody, lineCount: lines.length });
    if (lines.length) {
      await BankStatementLine.insertMany(lines.map(l => ({ ...l, bankStatement: doc._id, bankAccount: doc.bankAccount })));
    }
    return created(res, doc, 'Statement imported');
  } catch (e) { return serverError(res, e); }
};

exports.getStatementLines = async (req, res) => {
  try {
    const { page = 1, limit = 50, matchStatus } = req.query;
    const q = { bankStatement: req.params.id, isDeleted: false };
    if (matchStatus) q.matchStatus = matchStatus;
    const [data, total] = await Promise.all([
      BankStatementLine.find(q).sort({ lineDate: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      BankStatementLine.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

// ── Bank Charges ──────────────────────────────────────────────────────────────

exports.getCharges = async (req, res) => {
  try {
    const { page = 1, limit = 20, bankAccount, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (bankAccount) q.bankAccount = bankAccount;
    if (startDate || endDate) {
      q.chargeDate = {};
      if (startDate) q.chargeDate.$gte = new Date(startDate);
      if (endDate)   q.chargeDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      BankCharge.find(q).sort({ chargeDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      BankCharge.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createCharge = async (req, res) => {
  try {
    const doc = await BankCharge.create({ ...req.body, totalAmount: (req.body.amount || 0) + (req.body.gstAmount || 0) });
    return created(res, doc, 'Bank charge recorded');
  } catch (e) { return serverError(res, e); }
};

// ── Interest Postings ─────────────────────────────────────────────────────────

exports.getInterestPostings = async (req, res) => {
  try {
    const { page = 1, limit = 20, bankAccount } = req.query;
    const q = { isDeleted: false };
    if (bankAccount) q.bankAccount = bankAccount;
    const [data, total] = await Promise.all([
      InterestPosting.find(q).sort({ postingDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName').populate('fixedDeposit', 'fdNumber'),
      InterestPosting.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createInterestPosting = async (req, res) => {
  try {
    const doc = await InterestPosting.create({
      ...req.body,
      netInterest: (req.body.interestAmount || 0) - (req.body.tdsAmount || 0),
    });
    return created(res, doc, 'Interest posting created');
  } catch (e) { return serverError(res, e); }
};

// ── Electronic Payments ───────────────────────────────────────────────────────

exports.getElectronicPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, bankAccount, paymentMode, status } = req.query;
    const q = { isDeleted: false };
    if (bankAccount) q.bankAccount = bankAccount;
    if (paymentMode) q.paymentMode = paymentMode;
    if (status)      q.status      = status;
    const [data, total] = await Promise.all([
      ElectronicPayment.find(q).sort({ paymentDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      ElectronicPayment.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createElectronicPayment = async (req, res) => {
  try {
    const doc = await ElectronicPayment.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('bank:transaction_posted', { type: 'electronic_payment', paymentNumber: doc.paymentNumber, amount: doc.amount, mode: doc.paymentMode });
    return created(res, doc, 'Electronic payment initiated');
  } catch (e) { return serverError(res, e); }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId, rrn } = req.body;
    const doc = await ElectronicPayment.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { status, transactionId, rrn }, { new: true });
    if (!doc) return notFound(res, 'Electronic payment');
    return ok(res, doc, `Payment ${status}`);
  } catch (e) { return serverError(res, e); }
};

// ── Cheque Books ──────────────────────────────────────────────────────────────

exports.getChequeBooks = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.bankAccount) q.bankAccount = req.query.bankAccount;
    if (req.query.status)      q.status      = req.query.status;
    const data = await ChequeBook.find(q).sort({ createdAt: -1 }).populate('bankAccount', 'accountName accountNumber');
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createChequeBook = async (req, res) => {
  try {
    const { fromChequeNo, toChequeNo } = req.body;
    const from = parseInt(fromChequeNo, 10);
    const to   = parseInt(toChequeNo,   10);
    const totalLeaves = isNaN(from) || isNaN(to) ? 0 : (to - from + 1);
    const doc = await ChequeBook.create({ ...req.body, totalLeaves, availableLeaves: totalLeaves });
    return created(res, doc, 'Cheque book added');
  } catch (e) { return serverError(res, e); }
};

// ── Cheques ───────────────────────────────────────────────────────────────────

exports.getCheques = async (req, res) => {
  try {
    const { page = 1, limit = 20, bankAccount, chequeType, status } = req.query;
    const q = { isDeleted: false };
    if (bankAccount) q.bankAccount = bankAccount;
    if (chequeType)  q.chequeType  = chequeType;
    if (status)      q.status      = status;
    const [data, total] = await Promise.all([
      Cheque.find(q).sort({ chequeDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      Cheque.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createCheque = async (req, res) => {
  try {
    const doc = await Cheque.create(req.body);
    return created(res, doc, 'Cheque recorded');
  } catch (e) { return serverError(res, e); }
};

exports.updateChequeStatus = async (req, res) => {
  try {
    const { status, clearingDate, bouncedDate, bounceReason } = req.body;
    const update = { status };
    if (clearingDate) update.clearingDate = clearingDate;
    if (bouncedDate)  update.bouncedDate  = bouncedDate;
    if (bounceReason) update.bounceReason = bounceReason;
    const doc = await Cheque.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, update, { new: true });
    if (!doc) return notFound(res, 'Cheque');
    return ok(res, doc, `Cheque ${status}`);
  } catch (e) { return serverError(res, e); }
};
