const VendorBill       = require('../models/VendorBill');
const VendorLedger     = require('../models/VendorLedger');
const GSTInputCredit   = require('../models/GSTInputCredit');
const JournalEntry     = require('../models/JournalEntry');
const JournalLine      = require('../models/JournalLine');
const AuditLog         = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── List ──────────────────────────────────────────────────────────────────────

exports.getBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, vendor, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (search) q.$or = [
      { billNumber: { $regex: search, $options: 'i' } },
      { vendorName: { $regex: search, $options: 'i' } },
      { vendorInvoiceNo: { $regex: search, $options: 'i' } },
    ];
    if (status) q.status = status;
    if (vendor) q.vendor = vendor;
    if (startDate || endDate) {
      q.billDate = {};
      if (startDate) q.billDate.$gte = new Date(startDate);
      if (endDate)   q.billDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      VendorBill.find(q).sort({ billDate: -1, createdAt: -1 })
        .populate('vendor', 'name email')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      VendorBill.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getBill = async (req, res) => {
  try {
    const doc = await VendorBill.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name email phone gstin')
      .populate('purchaseOrder', 'poNumber')
      .populate('grn', 'grnNumber')
      .populate('approvedBy', 'name')
      .populate('items.costCenter', 'name centerCode')
      .populate('items.glAccount', 'accountName accountCode');
    if (!doc) return notFound(res, 'Vendor Bill');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createBill = async (req, res) => {
  try {
    const doc = await VendorBill.create({ ...req.body, createdBy: req.admin._id });
    const io = req.app.locals.io;
    if (io) io.emit('finance:vendor_bill_created', { billId: doc._id, billNumber: doc.billNumber, vendorName: doc.vendorName });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'CREATE', entity: 'VendorBill',
      entityId: doc._id, entityLabel: doc.billNumber,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Vendor bill created');
  } catch (e) { return serverError(res, e); }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateBill = async (req, res) => {
  try {
    const doc = await VendorBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Bill');
    if (!['draft','submitted'].includes(doc.status)) return fail(res, 'Only draft or submitted bills can be edited');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'UPDATE', entity: 'VendorBill',
      entityId: doc._id, entityLabel: doc.billNumber,
      changes: { before, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Vendor bill updated');
  } catch (e) { return serverError(res, e); }
};

// ── Submit ────────────────────────────────────────────────────────────────────

exports.submitBill = async (req, res) => {
  try {
    const doc = await VendorBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Bill');
    if (doc.status !== 'draft') return fail(res, 'Only draft bills can be submitted');
    doc.status = 'submitted';
    doc.approvalStatus = 'pending';
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:vendor_bill_created', { billId: doc._id, billNumber: doc.billNumber, status: 'submitted' });
    return ok(res, doc, 'Vendor bill submitted for approval');
  } catch (e) { return serverError(res, e); }
};

// ── Approve ───────────────────────────────────────────────────────────────────

exports.approveBill = async (req, res) => {
  try {
    const doc = await VendorBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Bill');
    if (doc.status !== 'submitted') return fail(res, 'Only submitted bills can be approved');
    doc.status         = 'approved';
    doc.approvalStatus = 'approved';
    doc.approvedBy     = req.admin._id;
    doc.approvedAt     = new Date();
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:vendor_bill_approved', { billId: doc._id, billNumber: doc.billNumber });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'APPROVE', entity: 'VendorBill',
      entityId: doc._id, entityLabel: doc.billNumber,
      changes: { before: { status: 'submitted' }, after: { status: 'approved' } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Vendor bill approved');
  } catch (e) { return serverError(res, e); }
};

// ── Reject ────────────────────────────────────────────────────────────────────

exports.rejectBill = async (req, res) => {
  try {
    const doc = await VendorBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Bill');
    if (!['submitted','approved'].includes(doc.status)) return fail(res, 'Cannot reject this bill');
    doc.status = 'cancelled';
    doc.approvalStatus = 'rejected';
    doc.rejectedReason = req.body.reason || '';
    await doc.save();
    return ok(res, doc, 'Vendor bill rejected');
  } catch (e) { return serverError(res, e); }
};

// ── Post to GL ────────────────────────────────────────────────────────────────

exports.postBillToGL = async (req, res) => {
  try {
    const doc = await VendorBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Bill');
    if (doc.glPosted) return fail(res, 'Bill is already posted to GL');
    if (doc.status !== 'approved') return fail(res, 'Only approved bills can be posted to GL');

    const { apAccount, expenseAccount, fiscalYear, period } = req.body;
    if (!apAccount || !expenseAccount) return fail(res, 'apAccount and expenseAccount are required for GL posting');

    const totalDebit  = doc.totalAmount;
    const totalCredit = doc.totalAmount;

    const journal = await JournalEntry.create({
      journalType:  'purchase',
      entryDate:    doc.billDate,
      narration:    `Vendor Bill ${doc.billNumber} - ${doc.vendorName}`,
      totalDebit,
      totalCredit,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
      reference:    doc.billNumber,
      sourceModule: 'purchase',
      sourceId:     doc._id,
      createdBy:    req.admin._id,
      status:       'posted',
      postedAt:     new Date(),
      postedBy:     req.admin._id,
    });

    const lines = await JournalLine.insertMany([
      { journalEntry: journal._id, lineNumber: 1, account: expenseAccount, debit: totalDebit, credit: 0, narration: `Purchase expense - ${doc.billNumber}` },
      { journalEntry: journal._id, lineNumber: 2, account: apAccount, debit: 0, credit: totalCredit, narration: `AP liability - ${doc.billNumber}` },
    ]);

    await postJournalToLedger(journal, lines);

    doc.journalEntry = journal._id;
    doc.glPosted     = true;
    await doc.save();

    // Create vendor ledger entry
    await VendorLedger.create({
      vendor:      doc.vendor,
      vendorName:  doc.vendorName,
      entryDate:   doc.billDate,
      entryType:   'bill',
      reference:   doc.billNumber,
      sourceId:    doc._id,
      sourceModel: 'VendorBill',
      narration:   `Vendor Bill ${doc.billNumber}`,
      debit:       totalDebit,
      credit:      0,
      journalEntry: journal._id,
      fiscalYear:  fiscalYear || null,
      period:      period || null,
    });

    // Create GST input credit if eligible
    if (doc.gstInputCredit && doc.gstTotal > 0) {
      await GSTInputCredit.create({
        vendor:       doc.vendor,
        vendorName:   doc.vendorName,
        vendorGST:    doc.vendorGST,
        vendorBill:   doc._id,
        billNumber:   doc.billNumber,
        billDate:     doc.billDate,
        invoiceValue: doc.totalAmount,
        igstAmount:   doc.igstTotal || 0,
        cgstAmount:   doc.cgstTotal || 0,
        sgstAmount:   doc.sgstTotal || 0,
        totalTax:     doc.gstTotal || 0,
        eligibleCredit: doc.gstTotal || 0,
        reverseCharge: doc.isReverseCharge || false,
        journalEntry: journal._id,
        fiscalYear:   fiscalYear || null,
        period:       period || null,
      });
    }

    const io = req.app.locals.io;
    if (io) io.emit('finance:vendor_bill_approved', { billId: doc._id, billNumber: doc.billNumber, glPosted: true });

    return ok(res, doc, 'Vendor bill posted to GL');
  } catch (e) { return serverError(res, e); }
};

// ── Delete ────────────────────────────────────────────────────────────────────

exports.deleteBill = async (req, res) => {
  try {
    const doc = await VendorBill.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Bill');
    if (!['draft','cancelled'].includes(doc.status)) return fail(res, 'Only draft or cancelled bills can be deleted');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Vendor bill deleted');
  } catch (e) { return serverError(res, e); }
};
