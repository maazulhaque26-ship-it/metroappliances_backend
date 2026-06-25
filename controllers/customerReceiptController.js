const CustomerReceipt    = require('../models/CustomerReceipt');
const CustomerInvoice    = require('../models/CustomerInvoice');
const CustomerAdvance    = require('../models/CustomerAdvance');
const CustomerLedger     = require('../models/CustomerLedger');
const ReceiptAllocation  = require('../models/ReceiptAllocation');
const ReceiptRegister    = require('../models/ReceiptRegister');
const JournalEntry       = require('../models/JournalEntry');
const JournalLine        = require('../models/JournalLine');
const AuditLog           = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── List ──────────────────────────────────────────────────────────────────────

exports.getReceipts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, customer, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (search) q.$or = [
      { receiptNumber: { $regex: search, $options: 'i' } },
      { customerName:  { $regex: search, $options: 'i' } },
      { referenceNo:   { $regex: search, $options: 'i' } },
    ];
    if (status)   q.status   = status;
    if (customer) q.customer = customer;
    if (startDate || endDate) {
      q.receiptDate = {};
      if (startDate) q.receiptDate.$gte = new Date(startDate);
      if (endDate)   q.receiptDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      CustomerReceipt.find(q).sort({ receiptDate: -1, createdAt: -1 })
        .populate('customer', 'name email')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      CustomerReceipt.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getReceipt = async (req, res) => {
  try {
    const doc = await CustomerReceipt.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name email phone')
      .populate('allocations.customerInvoice', 'invoiceNumber totalAmount');
    if (!doc) return notFound(res, 'Customer Receipt');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createReceipt = async (req, res) => {
  try {
    const doc = await CustomerReceipt.create({ ...req.body, createdBy: req.admin._id });
    const io = req.app.locals.io;
    if (io) io.emit('finance:receipt_received', { receiptId: doc._id, receiptNumber: doc.receiptNumber, customerName: doc.customerName });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'CREATE', entity: 'CustomerReceipt',
      entityId: doc._id, entityLabel: doc.receiptNumber,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Receipt created');
  } catch (e) { return serverError(res, e); }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateReceipt = async (req, res) => {
  try {
    const doc = await CustomerReceipt.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Receipt');
    if (!['draft'].includes(doc.status)) return fail(res, 'Only draft receipts can be edited');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Receipt updated');
  } catch (e) { return serverError(res, e); }
};

// ── Post to GL ────────────────────────────────────────────────────────────────

exports.postReceipt = async (req, res) => {
  try {
    const doc = await CustomerReceipt.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Receipt');
    if (doc.glPosted) return fail(res, 'Receipt is already posted');
    if (doc.status !== 'draft') return fail(res, 'Only draft receipts can be posted');

    const { bankAccount, arAccount, fiscalYear, period } = req.body;
    if (!bankAccount || !arAccount) return fail(res, 'bankAccount and arAccount are required');

    const netAmount = doc.netAmount || doc.amount;

    const journal = await JournalEntry.create({
      journalType:  'receipt',
      entryDate:    doc.receiptDate,
      narration:    `Customer Receipt ${doc.receiptNumber} - ${doc.customerName}`,
      totalDebit:   netAmount,
      totalCredit:  netAmount,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
      reference:    doc.receiptNumber,
      sourceModule: 'receivable',
      sourceId:     doc._id,
      createdBy:    req.admin._id,
      status:       'posted',
      postedAt:     new Date(),
      postedBy:     req.admin._id,
    });

    const lines = await JournalLine.insertMany([
      { journalEntry: journal._id, lineNumber: 1, account: bankAccount, debit: netAmount, credit: 0, narration: `Bank receipt - ${doc.receiptNumber}` },
      { journalEntry: journal._id, lineNumber: 2, account: arAccount, debit: 0, credit: netAmount, narration: `AR cleared - ${doc.receiptNumber}` },
    ]);

    await postJournalToLedger(journal, lines);

    doc.journalEntry = journal._id;
    doc.glPosted     = true;
    doc.status       = 'posted';
    doc.bankAccount  = bankAccount;
    doc.arAccount    = arAccount;
    doc.unallocatedAmount = doc.isAdvance ? netAmount : (doc.unallocatedAmount || netAmount);
    await doc.save();

    // Update outstanding on allocated invoices
    if (doc.allocations && doc.allocations.length > 0) {
      for (const alloc of doc.allocations) {
        const inv = await CustomerInvoice.findById(alloc.customerInvoice);
        if (inv) {
          inv.paidAmount        = (inv.paidAmount || 0) + alloc.allocatedAmount;
          inv.outstandingAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
          inv.status = inv.outstandingAmount <= 0 ? 'paid' : 'partially_paid';
          await inv.save();

          await CustomerLedger.create({
            customer:     doc.customer,
            customerName: doc.customerName,
            entryDate:    doc.receiptDate,
            entryType:    'receipt',
            reference:    doc.receiptNumber,
            sourceId:     doc._id,
            sourceModel:  'CustomerReceipt',
            narration:    `Receipt ${doc.receiptNumber} applied to ${inv.invoiceNumber}`,
            debit:        0,
            credit:       alloc.allocatedAmount,
            journalEntry: journal._id,
            fiscalYear:   fiscalYear || null,
            period:       period || null,
          });
        }
      }
    } else {
      await CustomerLedger.create({
        customer:     doc.customer,
        customerName: doc.customerName,
        entryDate:    doc.receiptDate,
        entryType:    doc.isAdvance ? 'advance' : 'receipt',
        reference:    doc.receiptNumber,
        sourceId:     doc._id,
        sourceModel:  'CustomerReceipt',
        narration:    `Receipt ${doc.receiptNumber}`,
        debit:        0,
        credit:       netAmount,
        journalEntry: journal._id,
        fiscalYear:   fiscalYear || null,
        period:       period || null,
      });
    }

    // If advance, create CustomerAdvance record
    if (doc.isAdvance) {
      await CustomerAdvance.create({
        customer:        doc.customer,
        customerName:    doc.customerName,
        advanceDate:     doc.receiptDate,
        advanceAmount:   netAmount,
        availableAmount: netAmount,
        receiptNumber:   doc.receiptNumber,
        customerReceipt: doc._id,
        paymentMode:     doc.receiptType,
        referenceNo:     doc.referenceNo,
        journalEntry:    journal._id,
        glPosted:        true,
      });
    }

    // Register receipt
    await ReceiptRegister.create({
      customerReceipt: doc._id,
      customer:        doc.customer,
      customerName:    doc.customerName,
      receiptDate:     doc.receiptDate,
      receiptNumber:   doc.receiptNumber,
      receiptType:     doc.receiptType,
      paymentMode:     doc.paymentMode,
      bankName:        doc.bankName,
      chequeNo:        doc.chequeNo,
      referenceNo:     doc.referenceNo,
      amount:          doc.amount,
      bankCharges:     doc.bankCharges,
      netAmount,
      fiscalYear:      fiscalYear || null,
      period:          period || null,
    });

    const io = req.app.locals.io;
    if (io) io.emit('finance:receipt_received', { receiptId: doc._id, receiptNumber: doc.receiptNumber, posted: true });

    return ok(res, doc, 'Receipt posted to GL');
  } catch (e) { return serverError(res, e); }
};

// ── Reverse ───────────────────────────────────────────────────────────────────

exports.reverseReceipt = async (req, res) => {
  try {
    const doc = await CustomerReceipt.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Receipt');
    if (doc.status !== 'posted') return fail(res, 'Only posted receipts can be reversed');

    const { reason, bankAccount, arAccount, fiscalYear, period } = req.body;
    if (!reason) return fail(res, 'Reversal reason is required');

    const netAmount = doc.netAmount || doc.amount;

    const reversalJournal = await JournalEntry.create({
      journalType:  'receipt',
      entryDate:    new Date(),
      narration:    `Reversal of Receipt ${doc.receiptNumber} - ${doc.customerName}`,
      totalDebit:   netAmount,
      totalCredit:  netAmount,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
      reference:    `REV-${doc.receiptNumber}`,
      sourceModule: 'receivable',
      sourceId:     doc._id,
      createdBy:    req.admin._id,
      status:       'posted',
      postedAt:     new Date(),
      postedBy:     req.admin._id,
    });

    const reversalBankAcc  = bankAccount  || doc.bankAccount;
    const reversalArAcc    = arAccount    || doc.arAccount;

    const lines = await JournalLine.insertMany([
      { journalEntry: reversalJournal._id, lineNumber: 1, account: reversalArAcc, debit: netAmount, credit: 0, narration: `AR reinstated - ${doc.receiptNumber}` },
      { journalEntry: reversalJournal._id, lineNumber: 2, account: reversalBankAcc, debit: 0, credit: netAmount, narration: `Bank reversal - ${doc.receiptNumber}` },
    ]);

    await postJournalToLedger(reversalJournal, lines);

    doc.status          = 'reversed';
    doc.reversalReason  = reason;
    await doc.save();

    // Reverse invoice allocations
    if (doc.allocations && doc.allocations.length > 0) {
      for (const alloc of doc.allocations) {
        const inv = await CustomerInvoice.findById(alloc.customerInvoice);
        if (inv) {
          inv.paidAmount        = Math.max(0, (inv.paidAmount || 0) - alloc.allocatedAmount);
          inv.outstandingAmount = inv.totalAmount - inv.paidAmount;
          inv.status            = inv.paidAmount > 0 ? 'partially_paid' : 'approved';
          await inv.save();
        }
      }
    }

    await CustomerLedger.create({
      customer:     doc.customer,
      customerName: doc.customerName,
      entryDate:    new Date(),
      entryType:    'receipt',
      reference:    `REV-${doc.receiptNumber}`,
      sourceId:     doc._id,
      sourceModel:  'CustomerReceipt',
      narration:    `Reversal of receipt ${doc.receiptNumber}: ${reason}`,
      debit:        netAmount,
      credit:       0,
      journalEntry: reversalJournal._id,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
    });

    const io = req.app.locals.io;
    if (io) io.emit('finance:receipt_reversed', { receiptId: doc._id, receiptNumber: doc.receiptNumber });

    return ok(res, doc, 'Receipt reversed');
  } catch (e) { return serverError(res, e); }
};

// ── Allocate ──────────────────────────────────────────────────────────────────

exports.allocateReceipt = async (req, res) => {
  try {
    const receipt = await CustomerReceipt.findOne({ _id: req.params.id, isDeleted: false });
    if (!receipt) return notFound(res, 'Customer Receipt');
    if (!['posted'].includes(receipt.status)) return fail(res, 'Only posted receipts can be allocated');

    const { lines = [] } = req.body;
    let totalAllocated = 0;

    for (const line of lines) {
      const inv = await CustomerInvoice.findById(line.customerInvoice);
      if (!inv) continue;
      const allocated = Math.min(line.allocatedAmount, inv.outstandingAmount);
      inv.paidAmount        = (inv.paidAmount || 0) + allocated;
      inv.outstandingAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
      inv.status = inv.outstandingAmount <= 0 ? 'paid' : 'partially_paid';
      await inv.save();
      line.allocatedAmount = allocated;
      line.netAllocated    = allocated - (line.discount || 0) - (line.writeOff || 0);
      totalAllocated      += allocated;
    }

    const alloc = await ReceiptAllocation.create({
      customerReceipt: receipt._id,
      customer:        receipt.customer,
      customerName:    receipt.customerName,
      allocationDate:  new Date(),
      lines,
      totalAllocated,
      createdBy:       req.admin._id,
      status:          'posted',
    });

    receipt.unallocatedAmount = Math.max(0, (receipt.unallocatedAmount || 0) - totalAllocated);
    await receipt.save();

    return created(res, alloc, 'Receipt allocated to invoices');
  } catch (e) { return serverError(res, e); }
};

// ── Get Allocations ───────────────────────────────────────────────────────────

exports.getAllocations = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    const [data, total] = await Promise.all([
      ReceiptAllocation.find(q).sort({ createdAt: -1 })
        .populate('customer', 'name')
        .populate('customerReceipt', 'receiptNumber')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      ReceiptAllocation.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

// ── Delete ────────────────────────────────────────────────────────────────────

exports.deleteReceipt = async (req, res) => {
  try {
    const doc = await CustomerReceipt.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Receipt');
    if (!['draft','cancelled'].includes(doc.status)) return fail(res, 'Only draft or cancelled receipts can be deleted');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Receipt deleted');
  } catch (e) { return serverError(res, e); }
};
