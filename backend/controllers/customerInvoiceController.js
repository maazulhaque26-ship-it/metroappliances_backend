const CustomerInvoice  = require('../models/CustomerInvoice');
const CustomerLedger   = require('../models/CustomerLedger');
const SalesRegister    = require('../models/SalesRegister');
const JournalEntry     = require('../models/JournalEntry');
const JournalLine      = require('../models/JournalLine');
const AuditLog         = require('../models/AuditLog');
const { postJournalToLedger } = require('./journalController');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── List ──────────────────────────────────────────────────────────────────────

exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, customer, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (search) q.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { customerName:  { $regex: search, $options: 'i' } },
    ];
    if (status)   q.status   = status;
    if (customer) q.customer = customer;
    if (startDate || endDate) {
      q.invoiceDate = {};
      if (startDate) q.invoiceDate.$gte = new Date(startDate);
      if (endDate)   q.invoiceDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      CustomerInvoice.find(q).sort({ invoiceDate: -1, createdAt: -1 })
        .populate('customer', 'name email')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      CustomerInvoice.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getInvoice = async (req, res) => {
  try {
    const doc = await CustomerInvoice.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name email phone')
      .populate('order', 'orderNumber')
      .populate('approvedBy', 'name')
      .populate('items.costCenter', 'name centerCode')
      .populate('items.glAccount', 'accountName accountCode');
    if (!doc) return notFound(res, 'Customer Invoice');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createInvoice = async (req, res) => {
  try {
    const doc = await CustomerInvoice.create({ ...req.body, createdBy: req.admin._id });
    const io = req.app.locals.io;
    if (io) io.emit('finance:invoice_created', { invoiceId: doc._id, invoiceNumber: doc.invoiceNumber, customerName: doc.customerName });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'CREATE', entity: 'CustomerInvoice',
      entityId: doc._id, entityLabel: doc.invoiceNumber,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Customer invoice created');
  } catch (e) { return serverError(res, e); }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateInvoice = async (req, res) => {
  try {
    const doc = await CustomerInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Invoice');
    if (!['draft','submitted'].includes(doc.status)) return fail(res, 'Only draft or submitted invoices can be edited');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'UPDATE', entity: 'CustomerInvoice',
      entityId: doc._id, entityLabel: doc.invoiceNumber,
      changes: { before, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Customer invoice updated');
  } catch (e) { return serverError(res, e); }
};

// ── Submit ────────────────────────────────────────────────────────────────────

exports.submitInvoice = async (req, res) => {
  try {
    const doc = await CustomerInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Invoice');
    if (doc.status !== 'draft') return fail(res, 'Only draft invoices can be submitted');
    doc.status = 'submitted';
    doc.approvalStatus = 'pending';
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:invoice_created', { invoiceId: doc._id, invoiceNumber: doc.invoiceNumber, status: 'submitted' });
    return ok(res, doc, 'Invoice submitted for approval');
  } catch (e) { return serverError(res, e); }
};

// ── Approve ───────────────────────────────────────────────────────────────────

exports.approveInvoice = async (req, res) => {
  try {
    const doc = await CustomerInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Invoice');
    if (doc.status !== 'submitted') return fail(res, 'Only submitted invoices can be approved');
    doc.status         = 'approved';
    doc.approvalStatus = 'approved';
    doc.approvedBy     = req.admin._id;
    doc.approvedAt     = new Date();
    doc.outstandingAmount = doc.totalAmount;
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:invoice_posted', { invoiceId: doc._id, invoiceNumber: doc.invoiceNumber });
    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'APPROVE', entity: 'CustomerInvoice',
      entityId: doc._id, entityLabel: doc.invoiceNumber,
      changes: { before: { status: 'submitted' }, after: { status: 'approved' } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Invoice approved');
  } catch (e) { return serverError(res, e); }
};

// ── Reject ────────────────────────────────────────────────────────────────────

exports.rejectInvoice = async (req, res) => {
  try {
    const doc = await CustomerInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Invoice');
    if (!['submitted','approved'].includes(doc.status)) return fail(res, 'Cannot reject this invoice');
    doc.status         = 'cancelled';
    doc.approvalStatus = 'rejected';
    doc.rejectedReason = req.body.reason || '';
    await doc.save();
    return ok(res, doc, 'Invoice rejected');
  } catch (e) { return serverError(res, e); }
};

// ── Post to GL ────────────────────────────────────────────────────────────────

exports.postInvoiceToGL = async (req, res) => {
  try {
    const doc = await CustomerInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Invoice');
    if (doc.glPosted) return fail(res, 'Invoice is already posted to GL');
    if (doc.status !== 'approved') return fail(res, 'Only approved invoices can be posted to GL');

    const { arAccount, revenueAccount, fiscalYear, period } = req.body;
    if (!arAccount || !revenueAccount) return fail(res, 'arAccount and revenueAccount are required');

    const totalAmount = doc.totalAmount;

    const journal = await JournalEntry.create({
      journalType:  'sales',
      entryDate:    doc.invoiceDate,
      narration:    `Customer Invoice ${doc.invoiceNumber} - ${doc.customerName}`,
      totalDebit:   totalAmount,
      totalCredit:  totalAmount,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
      reference:    doc.invoiceNumber,
      sourceModule: 'sales',
      sourceId:     doc._id,
      createdBy:    req.admin._id,
      status:       'posted',
      postedAt:     new Date(),
      postedBy:     req.admin._id,
    });

    const lines = await JournalLine.insertMany([
      { journalEntry: journal._id, lineNumber: 1, account: arAccount, debit: totalAmount, credit: 0, narration: `AR receivable - ${doc.invoiceNumber}` },
      { journalEntry: journal._id, lineNumber: 2, account: revenueAccount, debit: 0, credit: totalAmount, narration: `Sales revenue - ${doc.invoiceNumber}` },
    ]);

    await postJournalToLedger(journal, lines);

    doc.journalEntry    = journal._id;
    doc.glPosted        = true;
    doc.arAccount       = arAccount;
    doc.revenueAccount  = revenueAccount;
    await doc.save();

    await CustomerLedger.create({
      customer:     doc.customer,
      customerName: doc.customerName,
      entryDate:    doc.invoiceDate,
      entryType:    'invoice',
      reference:    doc.invoiceNumber,
      sourceId:     doc._id,
      sourceModel:  'CustomerInvoice',
      narration:    `Customer Invoice ${doc.invoiceNumber}`,
      debit:        totalAmount,
      credit:       0,
      journalEntry: journal._id,
      fiscalYear:   fiscalYear || null,
      period:       period || null,
    });

    await SalesRegister.create({
      customerInvoice: doc._id,
      customer:        doc.customer,
      customerName:    doc.customerName,
      customerGST:     doc.customerGST,
      invoiceDate:     doc.invoiceDate,
      invoiceNumber:   doc.invoiceNumber,
      invoiceType:     doc.invoiceType,
      subtotal:        doc.subtotal,
      discountTotal:   doc.discountTotal,
      taxableAmount:   doc.taxableAmount,
      igstAmount:      doc.igstTotal,
      cgstAmount:      doc.cgstTotal,
      sgstAmount:      doc.sgstTotal,
      taxAmount:       doc.gstTotal,
      totalAmount:     doc.totalAmount,
      fiscalYear:      fiscalYear || null,
      period:          period || null,
    });

    const io = req.app.locals.io;
    if (io) io.emit('finance:invoice_posted', { invoiceId: doc._id, invoiceNumber: doc.invoiceNumber, glPosted: true });

    return ok(res, doc, 'Invoice posted to GL');
  } catch (e) { return serverError(res, e); }
};

// ── Delete ────────────────────────────────────────────────────────────────────

exports.deleteInvoice = async (req, res) => {
  try {
    const doc = await CustomerInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Customer Invoice');
    if (!['draft','cancelled'].includes(doc.status)) return fail(res, 'Only draft or cancelled invoices can be deleted');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Invoice deleted');
  } catch (e) { return serverError(res, e); }
};
