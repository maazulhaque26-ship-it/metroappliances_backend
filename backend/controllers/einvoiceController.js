'use strict';
const EInvoice  = require('../models/EInvoice');
const AuditLog  = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

exports.getEInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, irnStatus, search } = req.query;
    const q = { isDeleted: false };
    if (irnStatus) q.irnStatus = irnStatus;
    if (search)    q.$or = [{ eInvoiceNumber: { $regex: search, $options: 'i' } }, { buyerGSTIN: { $regex: search, $options: 'i' } }, { buyerName: { $regex: search, $options: 'i' } }];
    const [data, total] = await Promise.all([
      EInvoice.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      EInvoice.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getEInvoice = async (req, res) => {
  try {
    const doc = await EInvoice.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customerInvoice', 'invoiceNumber totalAmount')
      .populate('gstInvoice', 'gstInvoiceNumber');
    if (!doc) return notFound(res, 'E-invoice');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createEInvoice = async (req, res) => {
  try {
    const doc = await EInvoice.create({ ...req.body, generatedBy: req.user._id });
    return created(res, doc, 'E-invoice created');
  } catch (e) { return serverError(res, e); }
};

exports.generateIRN = async (req, res) => {
  try {
    const doc = await EInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'E-invoice');
    if (doc.irnStatus === 'generated') return fail(res, 'IRN already generated');

    // Build a deterministic IRN-like hash: SellerGSTIN + DocType + DocNo + DocDate
    const sellerGSTIN = doc.sellerGSTIN || 'UNREGISTERED';
    const docType     = doc.documentType || 'INV';
    const docNo       = doc.invoiceNumber || doc.eInvoiceNumber;
    const docDate     = doc.invoiceDate ? new Date(doc.invoiceDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    const rawKey      = `${sellerGSTIN}|${docType}|${docNo}|${docDate}`;
    // Simple hex hash (not cryptographic — IRP validates separately in production)
    const irn = Buffer.from(rawKey).toString('hex').slice(0, 64).toUpperCase();

    doc.irn       = irn;
    doc.irnStatus = 'generated';
    doc.irnDate   = new Date();
    doc.ackNo     = req.body.ackNo || `ACK${Date.now()}`;
    doc.ackDate   = new Date();

    // QR payload
    doc.signedQRCode = Buffer.from(JSON.stringify({
      irn, sellerGSTIN, buyerGSTIN: doc.buyerGSTIN, docNo, docDate, docType,
      totalValue: doc.totalValue, cgstValue: doc.cgstValue, sgstValue: doc.sgstValue,
      igstValue: doc.igstValue, ackNo: doc.ackNo,
    })).toString('base64');

    await doc.save();

    const io = req.app.locals.io;
    if (io) io.emit('tax:einvoice_generated', { eInvoiceId: doc._id, eInvoiceNumber: doc.eInvoiceNumber, irn: doc.irn, buyerName: doc.buyerName });

    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'UPDATE', entity: 'EInvoice', entityId: doc._id, entityLabel: doc.eInvoiceNumber, changes: { before: { irnStatus: 'pending' }, after: { irnStatus: 'generated', irn: doc.irn } }, ip: req.ip, userAgent: req.headers['user-agent'] });

    return ok(res, doc, 'IRN generated successfully');
  } catch (e) { return serverError(res, e); }
};

exports.cancelEInvoice = async (req, res) => {
  try {
    const doc = await EInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'E-invoice');
    if (doc.irnStatus !== 'generated') return fail(res, 'Only generated e-invoices can be cancelled');
    doc.irnStatus            = 'cancelled';
    doc.cancellationReason   = req.body.reason || '';
    doc.cancellationDate     = new Date();
    await doc.save();
    return ok(res, doc, 'E-invoice cancelled');
  } catch (e) { return serverError(res, e); }
};

exports.deleteEInvoice = async (req, res) => {
  try {
    const doc = await EInvoice.findOneAndUpdate({ _id: req.params.id, irnStatus: 'pending' }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'E-invoice');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};
