const VendorPayment    = require('../models/VendorPayment');
const VendorBill       = require('../models/VendorBill');
const VendorLedger     = require('../models/VendorLedger');
const PaymentAllocation = require('../models/PaymentAllocation');
const JournalEntry     = require('../models/JournalEntry');
const JournalLine      = require('../models/JournalLine');
const AuditLog         = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── List ──────────────────────────────────────────────────────────────────────

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, vendor, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (search) q.$or = [
      { paymentNumber: { $regex: search, $options: 'i' } },
      { vendorName:    { $regex: search, $options: 'i' } },
      { utrNumber:     { $regex: search, $options: 'i' } },
    ];
    if (status) q.status = status;
    if (vendor) q.vendor = vendor;
    if (startDate || endDate) {
      q.paymentDate = {};
      if (startDate) q.paymentDate.$gte = new Date(startDate);
      if (endDate)   q.paymentDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      VendorPayment.find(q).sort({ paymentDate: -1, createdAt: -1 })
        .populate('vendor', 'name email')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      VendorPayment.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getPayment = async (req, res) => {
  try {
    const doc = await VendorPayment.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name email phone')
      .populate('allocations.vendorBill', 'billNumber totalAmount outstandingAmount')
      .populate('approvedBy', 'name')
      .populate('journalEntry');
    if (!doc) return notFound(res, 'Vendor Payment');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createPayment = async (req, res) => {
  try {
    const doc = await VendorPayment.create({ ...req.body, createdBy: req.admin._id });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'CREATE', entity: 'VendorPayment',
      entityId: doc._id, entityLabel: doc.paymentNumber,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Payment created');
  } catch (e) { return serverError(res, e); }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updatePayment = async (req, res) => {
  try {
    const doc = await VendorPayment.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Payment');
    if (!['draft'].includes(doc.status)) return fail(res, 'Only draft payments can be edited');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'UPDATE', entity: 'VendorPayment',
      entityId: doc._id, entityLabel: doc.paymentNumber,
      changes: { before, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Payment updated');
  } catch (e) { return serverError(res, e); }
};

// ── Approve ───────────────────────────────────────────────────────────────────

exports.approvePayment = async (req, res) => {
  try {
    const doc = await VendorPayment.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Payment');
    if (doc.status !== 'draft') return fail(res, 'Only draft payments can be approved');
    doc.status     = 'approved';
    doc.approvedBy = req.admin._id;
    doc.approvedAt = new Date();
    await doc.save();
    return ok(res, doc, 'Payment approved');
  } catch (e) { return serverError(res, e); }
};

// ── Post to GL ────────────────────────────────────────────────────────────────

exports.postPayment = async (req, res) => {
  try {
    const doc = await VendorPayment.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Payment');
    if (doc.glPosted) return fail(res, 'Payment already posted to GL');
    if (!['approved','draft'].includes(doc.status)) return fail(res, 'Payment must be approved before posting');

    const { apAccount, bankAccount, fiscalYear, period } = req.body;
    if (!apAccount || !bankAccount) return fail(res, 'apAccount and bankAccount are required for GL posting');

    const netAmt = doc.netAmount || doc.amount;

    const journal = await JournalEntry.create({
      journalType:  'payment',
      entryDate:    doc.paymentDate,
      narration:    `Payment to ${doc.vendorName} - ${doc.paymentNumber}`,
      totalDebit:   netAmt,
      totalCredit:  netAmt,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
      reference:    doc.paymentNumber,
      sourceModule: 'purchase',
      sourceId:     doc._id,
      createdBy:    req.admin._id,
      status:       'posted',
      postedAt:     new Date(),
      postedBy:     req.admin._id,
    });

    const lines = await JournalLine.insertMany([
      { journalEntry: journal._id, lineNumber: 1, account: apAccount,   debit: netAmt, credit: 0,      narration: `AP cleared - ${doc.paymentNumber}` },
      { journalEntry: journal._id, lineNumber: 2, account: bankAccount, debit: 0,      credit: netAmt, narration: `Bank payment - ${doc.paymentNumber}` },
    ]);

    await postJournalToLedger(journal, lines);

    doc.journalEntry = journal._id;
    doc.glPosted     = true;
    doc.status       = 'posted';
    await doc.save();

    // Update allocations — reduce outstanding on each bill
    const allocationLines = [];
    for (const alloc of doc.allocations) {
      const bill = await VendorBill.findById(alloc.vendorBill);
      if (!bill) continue;
      const before = bill.outstandingAmount;
      bill.paidAmount += alloc.allocatedAmount;
      bill.outstandingAmount = Math.max(0, bill.outstandingAmount - alloc.allocatedAmount);
      bill.status = bill.outstandingAmount <= 0 ? 'paid' : 'partially_paid';
      await bill.save();
      allocationLines.push({
        vendorBill: alloc.vendorBill,
        billNumber: alloc.billNumber,
        billTotal: bill.totalAmount,
        outstandingBefore: before,
        allocatedAmount: alloc.allocatedAmount,
        outstandingAfter: bill.outstandingAmount,
      });
    }

    if (allocationLines.length > 0) {
      await PaymentAllocation.create({
        vendorPayment:  doc._id,
        paymentNumber:  doc.paymentNumber,
        vendor:         doc.vendor,
        allocationDate: doc.paymentDate,
        lines:          allocationLines,
        totalAllocated: allocationLines.reduce((s, l) => s + l.allocatedAmount, 0),
        status:         'posted',
        journalEntry:   journal._id,
        createdBy:      req.admin._id,
      });
    }

    // Create vendor ledger entry
    await VendorLedger.create({
      vendor:      doc.vendor,
      vendorName:  doc.vendorName,
      entryDate:   doc.paymentDate,
      entryType:   'payment',
      reference:   doc.paymentNumber,
      sourceId:    doc._id,
      sourceModel: 'VendorPayment',
      narration:   `Payment - ${doc.paymentNumber}`,
      debit:       0,
      credit:      netAmt,
      journalEntry: journal._id,
      fiscalYear:  fiscalYear || null,
      period:      period || null,
    });

    const io = req.app.locals.io;
    if (io) io.emit('finance:payment_posted', { paymentId: doc._id, paymentNumber: doc.paymentNumber, vendorName: doc.vendorName, amount: netAmt });

    return ok(res, doc, 'Payment posted to GL');
  } catch (e) { return serverError(res, e); }
};

// ── Reverse ───────────────────────────────────────────────────────────────────

exports.reversePayment = async (req, res) => {
  try {
    const doc = await VendorPayment.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Payment');
    if (doc.status !== 'posted') return fail(res, 'Only posted payments can be reversed');
    const { reason, apAccount, bankAccount, fiscalYear, period } = req.body;
    if (!apAccount || !bankAccount) return fail(res, 'apAccount and bankAccount are required for reversal');

    const netAmt = doc.netAmount || doc.amount;

    const reversal = await VendorPayment.create({
      paymentType:   'reversal',
      vendor:        doc.vendor,
      vendorName:    doc.vendorName,
      paymentDate:   new Date(),
      paymentMethod: doc.paymentMethod,
      amount:        doc.amount,
      tdsAmount:     doc.tdsAmount,
      withholdingTax: doc.withholdingTax,
      netAmount:     netAmt,
      status:        'reversed',
      reversedFrom:  doc._id,
      reversalReason: reason || '',
      createdBy:     req.admin._id,
    });

    const journal = await JournalEntry.create({
      journalType:  'payment',
      entryDate:    new Date(),
      narration:    `Reversal of payment ${doc.paymentNumber}: ${reason || ''}`,
      totalDebit:   netAmt,
      totalCredit:  netAmt,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
      reference:    reversal.paymentNumber,
      sourceModule: 'purchase',
      sourceId:     reversal._id,
      createdBy:    req.admin._id,
      status:       'posted',
      postedAt:     new Date(),
      postedBy:     req.admin._id,
    });

    const lines = await JournalLine.insertMany([
      { journalEntry: journal._id, lineNumber: 1, account: bankAccount, debit: netAmt, credit: 0,      narration: `Bank reversal - ${reversal.paymentNumber}` },
      { journalEntry: journal._id, lineNumber: 2, account: apAccount,   debit: 0,      credit: netAmt, narration: `AP reinstated - ${reversal.paymentNumber}` },
    ]);

    await postJournalToLedger(journal, lines);

    reversal.journalEntry = journal._id;
    reversal.glPosted     = true;
    await reversal.save();

    doc.status = 'reversed';
    await doc.save();

    const io = req.app.locals.io;
    if (io) io.emit('finance:payment_reversed', { paymentId: doc._id, paymentNumber: doc.paymentNumber, reversalId: reversal._id });

    return ok(res, reversal, 'Payment reversed');
  } catch (e) { return serverError(res, e); }
};

// ── Delete ────────────────────────────────────────────────────────────────────

exports.deletePayment = async (req, res) => {
  try {
    const doc = await VendorPayment.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Payment');
    if (!['draft','cancelled'].includes(doc.status)) return fail(res, 'Only draft or cancelled payments can be deleted');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Payment deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Allocations ───────────────────────────────────────────────────────────────

exports.getAllocations = async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    const [data, total] = await Promise.all([
      PaymentAllocation.find(q).sort({ createdAt: -1 })
        .populate('vendor', 'name').populate('vendorPayment', 'paymentNumber amount')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      PaymentAllocation.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};
