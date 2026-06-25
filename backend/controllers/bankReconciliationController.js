const BankReconciliation = require('../models/BankReconciliation');
const ReconciliationMatch= require('../models/ReconciliationMatch');
const BankTransaction    = require('../models/BankTransaction');
const BankStatementLine  = require('../models/BankStatementLine');
const AuditLog           = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Reconciliations ───────────────────────────────────────────────────────────

exports.getReconciliations = async (req, res) => {
  try {
    const { page = 1, limit = 20, bankAccount, status } = req.query;
    const q = { isDeleted: false };
    if (bankAccount) q.bankAccount = bankAccount;
    if (status)      q.status      = status;
    const [data, total] = await Promise.all([
      BankReconciliation.find(q).sort({ reconciliationDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      BankReconciliation.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getReconciliation = async (req, res) => {
  try {
    const doc = await BankReconciliation.findOne({ _id: req.params.id, isDeleted: false })
      .populate('bankAccount', 'accountName accountNumber')
      .populate('bankStatement', 'statementNumber');
    if (!doc) return notFound(res, 'Reconciliation');
    const matches = await ReconciliationMatch.find({ reconciliation: doc._id, isDeleted: false })
      .populate('bankTransaction', 'transactionNumber amount transactionType transactionDate')
      .populate('statementLine', 'description debit credit lineDate');
    return ok(res, { ...doc.toObject(), matches });
  } catch (e) { return serverError(res, e); }
};

exports.createReconciliation = async (req, res) => {
  try {
    const doc = await BankReconciliation.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'RECONCILIATION_STARTED', entity: 'BankReconciliation', entityId: doc._id, entityLabel: doc.reconciliationNumber, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Reconciliation started');
  } catch (e) { return serverError(res, e); }
};

exports.autoMatch = async (req, res) => {
  try {
    const recon = await BankReconciliation.findOne({ _id: req.params.id, isDeleted: false });
    if (!recon) return notFound(res, 'Reconciliation');
    if (recon.status === 'completed') return fail(res, 'Reconciliation already completed');

    const [txns, stmtLines] = await Promise.all([
      BankTransaction.find({ bankAccount: recon.bankAccount, transactionDate: { $gte: recon.fromDate, $lte: recon.toDate }, isReconciled: false, isDeleted: false }),
      BankStatementLine.find({ bankAccount: recon.bankAccount, bankStatement: recon.bankStatement, matchStatus: 'unmatched', isDeleted: false }),
    ]);

    const matches = [];
    const matchedTxnIds  = new Set();
    const matchedLineIds = new Set();

    for (const line of stmtLines) {
      const lineAmt = (line.credit - line.debit);
      for (const txn of txns) {
        if (matchedTxnIds.has(txn._id.toString())) continue;
        const txnAmt = ['receipt','transfer_in','interest_credit','cash_deposit','opening_balance'].includes(txn.transactionType) ? txn.amount : -txn.amount;
        if (Math.abs(lineAmt - txnAmt) < 0.01) {
          matches.push({ reconciliation: recon._id, bankTransaction: txn._id, statementLine: line._id, matchType: 'auto', transactionAmount: txn.amount, statementAmount: Math.abs(lineAmt), difference: 0, matchedBy: req.user._id });
          matchedTxnIds.add(txn._id.toString());
          matchedLineIds.add(line._id.toString());
          break;
        }
      }
    }

    if (matches.length) {
      await ReconciliationMatch.insertMany(matches);
      await BankTransaction.updateMany({ _id: { $in: [...matchedTxnIds] } }, { isReconciled: true, reconciledOn: new Date(), status: 'reconciled' });
      await BankStatementLine.updateMany({ _id: { $in: [...matchedLineIds] } }, { matchStatus: 'matched', matchedOn: new Date() });
    }

    recon.totalMatched = (recon.totalMatched || 0) + matches.length;
    await recon.save();
    return ok(res, { matched: matches.length }, `Auto-matched ${matches.length} transactions`);
  } catch (e) { return serverError(res, e); }
};

exports.manualMatch = async (req, res) => {
  try {
    const { bankTransactionId, statementLineId } = req.body;
    const recon = await BankReconciliation.findOne({ _id: req.params.id, isDeleted: false });
    if (!recon) return notFound(res, 'Reconciliation');

    const [txn, line] = await Promise.all([
      BankTransaction.findById(bankTransactionId),
      BankStatementLine.findById(statementLineId),
    ]);
    if (!txn || !line) return fail(res, 'Transaction or statement line not found');

    const txnAmt  = txn.amount;
    const lineAmt = Math.abs(line.credit - line.debit);
    const diff    = Math.abs(txnAmt - lineAmt);

    const match = await ReconciliationMatch.create({ reconciliation: recon._id, bankTransaction: txn._id, statementLine: line._id, matchType: 'manual', transactionAmount: txnAmt, statementAmount: lineAmt, difference: diff, matchedBy: req.user._id });
    await BankTransaction.findByIdAndUpdate(txn._id, { isReconciled: true, reconciledOn: new Date(), status: 'reconciled' });
    await BankStatementLine.findByIdAndUpdate(line._id, { matchStatus: diff > 0 ? 'partial' : 'matched', matchedOn: new Date(), bankTransaction: txn._id });
    recon.totalMatched = (recon.totalMatched || 0) + 1;
    await recon.save();
    return ok(res, match, 'Manually matched');
  } catch (e) { return serverError(res, e); }
};

exports.completeReconciliation = async (req, res) => {
  try {
    const recon = await BankReconciliation.findOne({ _id: req.params.id, isDeleted: false });
    if (!recon) return notFound(res, 'Reconciliation');
    const { statementBalance, bookBalance } = req.body;
    recon.statementBalance = statementBalance || recon.statementBalance;
    recon.bookBalance      = bookBalance      || recon.bookBalance;
    recon.difference       = (recon.statementBalance - recon.bookBalance);
    recon.status           = 'completed';
    recon.completedOn      = new Date();
    recon.completedBy      = req.user._id;
    await recon.save();

    const io = req.app.locals.io;
    if (io) io.emit('bank:reconciliation_completed', { reconciliationNumber: recon.reconciliationNumber, bankAccount: recon.bankAccount });

    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'RECONCILIATION_COMPLETED', entity: 'BankReconciliation', entityId: recon._id, entityLabel: recon.reconciliationNumber, changes: { before: { status: 'in_progress' }, after: { status: 'completed' } }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, recon, 'Reconciliation completed');
  } catch (e) { return serverError(res, e); }
};

exports.deleteReconciliation = async (req, res) => {
  try {
    const doc = await BankReconciliation.findOneAndUpdate({ _id: req.params.id, isDeleted: false, status: 'in_progress' }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Reconciliation (in-progress only)');
    return noContent(res, 'Reconciliation deleted');
  } catch (e) { return serverError(res, e); }
};

exports.getUnmatchedTransactions = async (req, res) => {
  try {
    const recon = await BankReconciliation.findOne({ _id: req.params.id, isDeleted: false });
    if (!recon) return notFound(res, 'Reconciliation');
    const [unmatchedTxns, unmatchedLines] = await Promise.all([
      BankTransaction.find({ bankAccount: recon.bankAccount, transactionDate: { $gte: recon.fromDate, $lte: recon.toDate }, isReconciled: false, isDeleted: false }),
      BankStatementLine.find({ bankAccount: recon.bankAccount, bankStatement: recon.bankStatement, matchStatus: 'unmatched', isDeleted: false }),
    ]);
    return ok(res, { unmatchedTxns, unmatchedLines });
  } catch (e) { return serverError(res, e); }
};
