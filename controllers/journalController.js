const mongoose    = require('mongoose');
const JournalEntry = require('../models/JournalEntry');
const JournalLine  = require('../models/JournalLine');
const GeneralLedger = require('../models/GeneralLedger');
const LedgerBalance = require('../models/LedgerBalance');
const ChartOfAccount = require('../models/ChartOfAccount');
const AuditLog    = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function postJournalToLedger(journalEntry, lines) {
  const glDocs = lines.map(l => ({
    account:      l.account,
    journalEntry: journalEntry._id,
    journalLine:  l._id,
    entryDate:    journalEntry.entryDate,
    fiscalYear:   journalEntry.fiscalYear,
    period:       journalEntry.period,
    debit:        l.debit,
    credit:       l.credit,
    narration:    l.narration || journalEntry.narration,
    reference:    journalEntry.reference,
    costCenter:   l.costCenter,
    profitCenter: l.profitCenter,
    sourceModule: journalEntry.sourceModule,
    sourceId:     journalEntry.sourceId,
  }));
  await GeneralLedger.insertMany(glDocs);

  for (const l of lines) {
    await LedgerBalance.findOneAndUpdate(
      { account: l.account, fiscalYear: journalEntry.fiscalYear, period: journalEntry.period || null },
      {
        $inc: { periodDebit: l.debit, periodCredit: l.credit, balance: l.debit - l.credit },
        $set: { lastUpdated: new Date() },
        $setOnInsert: { openingDebit: 0, openingCredit: 0 },
      },
      { upsert: true, new: true }
    );
  }
}

// ── Journal Entries ───────────────────────────────────────────────────────────

exports.getJournals = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, journalType, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (search)      q.$or = [{ journalNumber: { $regex: search, $options: 'i' } }, { narration: { $regex: search, $options: 'i' } }];
    if (status)      q.status = status;
    if (journalType) q.journalType = journalType;
    if (startDate || endDate) {
      q.entryDate = {};
      if (startDate) q.entryDate.$gte = new Date(startDate);
      if (endDate)   q.entryDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      JournalEntry.find(q).sort({ entryDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      JournalEntry.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getJournal = async (req, res) => {
  try {
    const doc = await JournalEntry.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Journal entry');
    const lines = await JournalLine.find({ journalEntry: doc._id, isDeleted: false }).populate('account','accountCode accountName').sort({ lineNumber: 1 });
    return ok(res, { ...doc.toObject(), lines });
  } catch (e) { return serverError(res, e); }
};

exports.createJournal = async (req, res) => {
  try {
    const { lines = [], ...rest } = req.body;
    const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return fail(res, `Journal imbalanced: debit ${totalDebit.toFixed(2)} ≠ credit ${totalCredit.toFixed(2)}`);
    }
    const journal = await JournalEntry.create({ ...rest, totalDebit, totalCredit, createdBy: req.admin._id });
    const lineDocs = await JournalLine.insertMany(
      lines.map((l, i) => ({ ...l, journalEntry: journal._id, lineNumber: i + 1, baseDebit: l.debit || 0, baseCredit: l.credit || 0 }))
    );
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'JournalEntry', entityId: journal._id, entityLabel: journal.journalNumber, changes: { before: null, after: journal.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('finance:journal_created', { journalId: journal._id, journalNumber: journal.journalNumber });
    return created(res, { ...journal.toObject(), lines: lineDocs }, 'Journal entry created');
  } catch (e) { return serverError(res, e); }
};

exports.updateJournal = async (req, res) => {
  try {
    const doc = await JournalEntry.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Journal entry');
    if (doc.status === 'posted') return fail(res, 'Cannot edit a posted journal entry');
    const before = doc.toObject();
    const { lines, ...rest } = req.body;
    Object.assign(doc, rest);
    if (lines) {
      const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
      const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        return fail(res, `Journal imbalanced: debit ${totalDebit.toFixed(2)} ≠ credit ${totalCredit.toFixed(2)}`);
      }
      doc.totalDebit  = totalDebit;
      doc.totalCredit = totalCredit;
      await JournalLine.deleteMany({ journalEntry: doc._id });
      await JournalLine.insertMany(lines.map((l, i) => ({ ...l, journalEntry: doc._id, lineNumber: i + 1, baseDebit: l.debit || 0, baseCredit: l.credit || 0 })));
    }
    await doc.save();
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'UPDATE', entity: 'JournalEntry', entityId: doc._id, entityLabel: doc.journalNumber, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc, 'Journal entry updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteJournal = async (req, res) => {
  try {
    const doc = await JournalEntry.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Journal entry');
    if (doc.status === 'posted') return fail(res, 'Cannot delete a posted journal entry');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Journal entry deleted');
  } catch (e) { return serverError(res, e); }
};

exports.postJournal = async (req, res) => {
  try {
    const doc = await JournalEntry.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Journal entry');
    if (doc.status === 'posted') return fail(res, 'Already posted');
    if (doc.status !== 'draft')  return fail(res, `Cannot post a journal in '${doc.status}' status`);

    const lines = await JournalLine.find({ journalEntry: doc._id, isDeleted: false });
    const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return fail(res, `Cannot post: journal imbalanced (debit ${totalDebit.toFixed(2)} ≠ credit ${totalCredit.toFixed(2)})`);
    }

    doc.status   = 'posted';
    doc.postedAt = new Date();
    doc.postedBy = req.admin._id;
    doc.totalDebit  = totalDebit;
    doc.totalCredit = totalCredit;
    await doc.save();

    await postJournalToLedger(doc, lines);

    const io = req.app.locals.io;
    if (io) io.emit('finance:journal_posted', { journalId: doc._id, journalNumber: doc.journalNumber });
    if (io) io.emit('finance:ledger_updated', { journalId: doc._id });

    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'POST', entity: 'JournalEntry', entityId: doc._id, entityLabel: doc.journalNumber, changes: { before: { status: 'draft' }, after: { status: 'posted' } }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc, 'Journal entry posted');
  } catch (e) { return serverError(res, e); }
};

exports.reverseJournal = async (req, res) => {
  try {
    const doc = await JournalEntry.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Journal entry');
    if (doc.status !== 'posted') return fail(res, 'Only posted journals can be reversed');

    const lines = await JournalLine.find({ journalEntry: doc._id, isDeleted: false });
    const reversalLines = lines.map((l, i) => ({ ...l.toObject(), _id: undefined, lineNumber: i + 1, debit: l.credit, credit: l.debit, baseDebit: l.baseCredit, baseCredit: l.baseDebit }));

    const reversal = await JournalEntry.create({
      journalType:  'reverse',
      entryDate:    req.body.reversalDate || new Date(),
      narration:    `Reversal of ${doc.journalNumber}: ${doc.narration}`,
      totalDebit:   doc.totalCredit,
      totalCredit:  doc.totalDebit,
      fiscalYear:   doc.fiscalYear,
      period:       doc.period,
      reversedFrom: doc._id,
      createdBy:    req.admin._id,
    });

    const reversalLineDocs = await JournalLine.insertMany(reversalLines.map(l => ({ ...l, journalEntry: reversal._id })));
    reversal.status   = 'posted';
    reversal.postedAt = new Date();
    reversal.postedBy = req.admin._id;
    await reversal.save();
    await postJournalToLedger(reversal, reversalLineDocs);

    doc.status = 'reversed';
    await doc.save();

    const io = req.app.locals.io;
    if (io) io.emit('finance:journal_posted', { journalId: reversal._id, journalNumber: reversal.journalNumber });

    return created(res, reversal, 'Journal reversed');
  } catch (e) { return serverError(res, e); }
};

exports.postJournalToLedger = postJournalToLedger;
