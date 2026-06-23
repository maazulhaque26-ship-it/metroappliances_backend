const CollectionActivity = require('../models/CollectionActivity');
const CollectionReminder = require('../models/CollectionReminder');
const PromiseToPay       = require('../models/PromiseToPay');
const BadDebt            = require('../models/BadDebt');
const WriteOff           = require('../models/WriteOff');
const CustomerInvoice    = require('../models/CustomerInvoice');
const CustomerLedger     = require('../models/CustomerLedger');
const JournalEntry       = require('../models/JournalEntry');
const JournalLine        = require('../models/JournalLine');
const AuditLog           = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Collection Activities ─────────────────────────────────────────────────────

exports.getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, activityType, outcome, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (customer)     q.customer     = customer;
    if (activityType) q.activityType = activityType;
    if (outcome)      q.outcome      = outcome;
    if (startDate || endDate) {
      q.activityDate = {};
      if (startDate) q.activityDate.$gte = new Date(startDate);
      if (endDate)   q.activityDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      CollectionActivity.find(q).sort({ activityDate: -1 })
        .populate('customer', 'name email')
        .populate('performedBy', 'name')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      CollectionActivity.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getActivity = async (req, res) => {
  try {
    const doc = await CollectionActivity.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name email')
      .populate('performedBy', 'name')
      .populate('customerInvoice', 'invoiceNumber totalAmount outstandingAmount');
    if (!doc) return notFound(res, 'Collection Activity');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createActivity = async (req, res) => {
  try {
    const doc = await CollectionActivity.create({ ...req.body, performedBy: req.body.performedBy || req.admin._id });
    const io = req.app.locals.io;
    if (io) io.emit('finance:collection_activity', { activityId: doc._id, activityNumber: doc.activityNumber, outcome: doc.outcome });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'CREATE', entity: 'CollectionActivity',
      entityId: doc._id, entityLabel: doc.activityNumber,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Collection activity logged');
  } catch (e) { return serverError(res, e); }
};

exports.updateActivity = async (req, res) => {
  try {
    const doc = await CollectionActivity.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Collection Activity');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Activity updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteActivity = async (req, res) => {
  try {
    const doc = await CollectionActivity.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Collection Activity');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Activity deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Collection Reminders ──────────────────────────────────────────────────────

exports.getReminders = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, status, reminderLevel } = req.query;
    const q = { isDeleted: false };
    if (customer)      q.customer      = customer;
    if (status)        q.status        = status;
    if (reminderLevel) q.reminderLevel = Number(reminderLevel);
    const [data, total] = await Promise.all([
      CollectionReminder.find(q).sort({ reminderDate: -1 }).populate('customer', 'name email').skip((page - 1) * limit).limit(Number(limit)).lean(),
      CollectionReminder.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createReminder = async (req, res) => {
  try {
    const doc = await CollectionReminder.create({ ...req.body, sentBy: req.admin._id });
    return created(res, doc, 'Collection reminder created');
  } catch (e) { return serverError(res, e); }
};

exports.sendReminder = async (req, res) => {
  try {
    const doc = await CollectionReminder.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Collection Reminder');
    doc.status = 'sent';
    doc.sentAt = new Date();
    await doc.save();
    return ok(res, doc, 'Reminder marked as sent');
  } catch (e) { return serverError(res, e); }
};

exports.deleteReminder = async (req, res) => {
  try {
    const doc = await CollectionReminder.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Collection Reminder');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Reminder deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Promise To Pay ────────────────────────────────────────────────────────────

exports.getPromises = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, status } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (status)   q.status   = status;
    const [data, total] = await Promise.all([
      PromiseToPay.find(q).sort({ promisedDate: 1 }).populate('customer', 'name email').populate('customerInvoice', 'invoiceNumber').skip((page - 1) * limit).limit(Number(limit)).lean(),
      PromiseToPay.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createPromise = async (req, res) => {
  try {
    const doc = await PromiseToPay.create(req.body);
    return created(res, doc, 'Promise to pay recorded');
  } catch (e) { return serverError(res, e); }
};

exports.updatePromise = async (req, res) => {
  try {
    const doc = await PromiseToPay.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Promise to Pay');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Promise updated');
  } catch (e) { return serverError(res, e); }
};

// ── Write-Off ─────────────────────────────────────────────────────────────────

exports.getWriteOffs = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, status } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (status)   q.status   = status;
    const [data, total] = await Promise.all([
      WriteOff.find(q).sort({ writeOffDate: -1 }).populate('customer', 'name email').populate('customerInvoice', 'invoiceNumber').skip((page - 1) * limit).limit(Number(limit)).lean(),
      WriteOff.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createWriteOff = async (req, res) => {
  try {
    const doc = await WriteOff.create({ ...req.body, createdBy: req.admin._id });
    return created(res, doc, 'Write-off created');
  } catch (e) { return serverError(res, e); }
};

exports.approveWriteOff = async (req, res) => {
  try {
    const doc = await WriteOff.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Write-Off');
    if (doc.status !== 'draft') return fail(res, 'Only draft write-offs can be approved');
    doc.status     = 'approved';
    doc.approvedBy = req.admin._id;
    doc.approvedAt = new Date();
    await doc.save();
    return ok(res, doc, 'Write-off approved');
  } catch (e) { return serverError(res, e); }
};

exports.postWriteOff = async (req, res) => {
  try {
    const doc = await WriteOff.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Write-Off');
    if (doc.glPosted) return fail(res, 'Write-off already posted');
    if (doc.status !== 'approved') return fail(res, 'Only approved write-offs can be posted');

    const { writeOffAccount, arAccount, fiscalYear, period } = req.body;
    if (!writeOffAccount || !arAccount) return fail(res, 'writeOffAccount and arAccount are required');

    const journal = await JournalEntry.create({
      journalType: 'write_off',
      entryDate:   doc.writeOffDate,
      narration:   `Write-off ${doc.writeOffNumber} - ${doc.customerName}`,
      totalDebit:  doc.writeOffAmount,
      totalCredit: doc.writeOffAmount,
      fiscalYear:  fiscalYear || null,
      period:      period || null,
      reference:   doc.writeOffNumber,
      sourceModule:'receivable',
      sourceId:    doc._id,
      createdBy:   req.admin._id,
      status:      'posted',
      postedAt:    new Date(),
      postedBy:    req.admin._id,
    });

    const lines = await JournalLine.insertMany([
      { journalEntry: journal._id, lineNumber: 1, account: writeOffAccount, debit: doc.writeOffAmount, credit: 0, narration: `Write-off expense - ${doc.writeOffNumber}` },
      { journalEntry: journal._id, lineNumber: 2, account: arAccount, debit: 0, credit: doc.writeOffAmount, narration: `AR cleared write-off - ${doc.writeOffNumber}` },
    ]);

    await postJournalToLedger(journal, lines);

    doc.journalEntry    = journal._id;
    doc.glPosted        = true;
    doc.status          = 'posted';
    doc.writeOffAccount = writeOffAccount;
    doc.arAccount       = arAccount;
    await doc.save();

    if (doc.customerInvoice) {
      const inv = await CustomerInvoice.findById(doc.customerInvoice);
      if (inv) {
        inv.outstandingAmount = Math.max(0, inv.outstandingAmount - doc.writeOffAmount);
        inv.status = inv.outstandingAmount <= 0 ? 'written_off' : 'partially_paid';
        await inv.save();
      }
    }

    await CustomerLedger.create({
      customer:     doc.customer,
      customerName: doc.customerName,
      entryDate:    doc.writeOffDate,
      entryType:    'write_off',
      reference:    doc.writeOffNumber,
      sourceId:     doc._id,
      sourceModel:  'WriteOff',
      narration:    `Write-off ${doc.writeOffNumber}: ${doc.reason}`,
      debit:        0,
      credit:       doc.writeOffAmount,
      journalEntry: journal._id,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
    });

    return ok(res, doc, 'Write-off posted to GL');
  } catch (e) { return serverError(res, e); }
};

// ── Bad Debt ──────────────────────────────────────────────────────────────────

exports.getBadDebts = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, status } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (status)   q.status   = status;
    const [data, total] = await Promise.all([
      BadDebt.find(q).sort({ createdAt: -1 }).populate('customer', 'name email').populate('customerInvoice', 'invoiceNumber').skip((page - 1) * limit).limit(Number(limit)).lean(),
      BadDebt.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createBadDebt = async (req, res) => {
  try {
    const doc = await BadDebt.create({ ...req.body, createdBy: req.admin._id });
    return created(res, doc, 'Bad debt provision created');
  } catch (e) { return serverError(res, e); }
};

exports.approveBadDebt = async (req, res) => {
  try {
    const doc = await BadDebt.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Bad Debt');
    if (doc.status !== 'pending_approval') return fail(res, 'Only pending bad debts can be approved');
    doc.status     = 'approved';
    doc.approvedBy = req.admin._id;
    doc.approvedAt = new Date();
    await doc.save();
    return ok(res, doc, 'Bad debt approved');
  } catch (e) { return serverError(res, e); }
};

exports.postBadDebt = async (req, res) => {
  try {
    const doc = await BadDebt.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Bad Debt');
    if (doc.glPosted) return fail(res, 'Bad debt already posted');
    if (doc.status !== 'approved') return fail(res, 'Only approved bad debts can be posted');

    const { badDebtAccount, arAccount, fiscalYear, period } = req.body;
    if (!badDebtAccount || !arAccount) return fail(res, 'badDebtAccount and arAccount are required');

    const journal = await JournalEntry.create({
      journalType: 'bad_debt',
      entryDate:   doc.writeOffDate || new Date(),
      narration:   `Bad Debt ${doc.badDebtNumber} - ${doc.customerName}`,
      totalDebit:  doc.badDebtAmount,
      totalCredit: doc.badDebtAmount,
      fiscalYear:  fiscalYear || null,
      period:      period || null,
      reference:   doc.badDebtNumber,
      sourceModule:'receivable',
      sourceId:    doc._id,
      createdBy:   req.admin._id,
      status:      'posted',
      postedAt:    new Date(),
      postedBy:    req.admin._id,
    });

    const lines = await JournalLine.insertMany([
      { journalEntry: journal._id, lineNumber: 1, account: badDebtAccount, debit: doc.badDebtAmount, credit: 0, narration: `Bad debt expense - ${doc.badDebtNumber}` },
      { journalEntry: journal._id, lineNumber: 2, account: arAccount, debit: 0, credit: doc.badDebtAmount, narration: `AR cleared bad debt - ${doc.badDebtNumber}` },
    ]);

    await postJournalToLedger(journal, lines);

    doc.journalEntry   = journal._id;
    doc.glPosted       = true;
    doc.status         = 'posted';
    doc.badDebtAccount = badDebtAccount;
    doc.arAccount      = arAccount;
    doc.writeOffDate   = new Date();
    await doc.save();

    await CustomerLedger.create({
      customer:     doc.customer,
      customerName: doc.customerName,
      entryDate:    new Date(),
      entryType:    'bad_debt',
      reference:    doc.badDebtNumber,
      sourceId:     doc._id,
      sourceModel:  'BadDebt',
      narration:    `Bad Debt ${doc.badDebtNumber}: ${doc.reason}`,
      debit:        0,
      credit:       doc.badDebtAmount,
      journalEntry: journal._id,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
    });

    return ok(res, doc, 'Bad debt posted to GL');
  } catch (e) { return serverError(res, e); }
};
