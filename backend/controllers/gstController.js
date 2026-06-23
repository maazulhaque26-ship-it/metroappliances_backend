'use strict';
const GSTRegistration      = require('../models/GSTRegistration');
const GSTReturn            = require('../models/GSTReturn');
const GSTInvoice           = require('../models/GSTInvoice');
const GSTAdjustment        = require('../models/GSTAdjustment');
const GSTInputCreditLedger = require('../models/GSTInputCreditLedger');
const GSTOutputTaxLedger   = require('../models/GSTOutputTaxLedger');
const GSTSettlement        = require('../models/GSTSettlement');
const GSTInputCredit       = require('../models/GSTInputCredit');
const AuditLog             = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── GST Registrations ─────────────────────────────────────────────────────────

exports.getRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const q = { isDeleted: false };
    const [data, total] = await Promise.all([
      GSTRegistration.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      GSTRegistration.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createRegistration = async (req, res) => {
  try {
    const doc = await GSTRegistration.create({ ...req.body });
    return created(res, doc, 'GST registration created');
  } catch (e) { return serverError(res, e); }
};

exports.updateRegistration = async (req, res) => {
  try {
    const doc = await GSTRegistration.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'GST registration');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteRegistration = async (req, res) => {
  try {
    const doc = await GSTRegistration.findOneAndUpdate({ _id: req.params.id }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'GST registration');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};

// ── GST Returns ───────────────────────────────────────────────────────────────

exports.getReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20, returnType, period, status } = req.query;
    const q = { isDeleted: false };
    if (returnType) q.returnType = returnType;
    if (period)     q.period     = period;
    if (status)     q.status     = status;
    const [data, total] = await Promise.all([
      GSTReturn.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      GSTReturn.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getReturn = async (req, res) => {
  try {
    const doc = await GSTReturn.findOne({ _id: req.params.id, isDeleted: false }).populate('gstRegistration','gstin legalName');
    if (!doc) return notFound(res, 'GST return');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createReturn = async (req, res) => {
  try {
    const doc = await GSTReturn.create({ ...req.body, filedBy: req.user._id });
    const io = req.app.locals.io;
    if (io) io.emit('tax:gst_return_generated', { returnId: doc._id, returnNumber: doc.returnNumber, returnType: doc.returnType, period: doc.period });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'CREATE', entity: 'GSTReturn', entityId: doc._id, entityLabel: doc.returnNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'GST return created');
  } catch (e) { return serverError(res, e); }
};

exports.updateReturn = async (req, res) => {
  try {
    const doc = await GSTReturn.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'GST return');
    if (doc.status === 'filed') return fail(res, 'Filed returns cannot be modified');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.fileReturn = async (req, res) => {
  try {
    const doc = await GSTReturn.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'GST return');
    doc.status     = 'filed';
    doc.filingDate = new Date();
    doc.filedBy    = req.user._id;
    if (req.body.arn) doc.arn = req.body.arn;
    if (req.body.acknowledgementNumber) doc.acknowledgementNumber = req.body.acknowledgementNumber;
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('tax:gst_return_generated', { returnId: doc._id, returnNumber: doc.returnNumber, period: doc.period, status: 'filed' });
    return ok(res, doc, 'GST return filed');
  } catch (e) { return serverError(res, e); }
};

exports.deleteReturn = async (req, res) => {
  try {
    const doc = await GSTReturn.findOneAndUpdate({ _id: req.params.id, status: { $ne: 'filed' } }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'GST return');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};

// ── GST Invoices ──────────────────────────────────────────────────────────────

exports.getGSTInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, invoiceType, period, search } = req.query;
    const q = { isDeleted: false };
    if (invoiceType) q.invoiceType = invoiceType;
    if (period)      q.gstr1Period = period;
    if (search)      q.$or = [{ partyName: { $regex: search, $options: 'i' } }, { gstInvoiceNumber: { $regex: search, $options: 'i' } }];
    const [data, total] = await Promise.all([
      GSTInvoice.find(q).sort({ invoiceDate: -1 }).skip((page-1)*limit).limit(Number(limit)),
      GSTInvoice.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createGSTInvoice = async (req, res) => {
  try {
    const doc = await GSTInvoice.create(req.body);
    return created(res, doc, 'GST invoice created');
  } catch (e) { return serverError(res, e); }
};

exports.updateGSTInvoice = async (req, res) => {
  try {
    const doc = await GSTInvoice.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'GST invoice');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── GST Adjustments ───────────────────────────────────────────────────────────

exports.getAdjustments = async (req, res) => {
  try {
    const { page = 1, limit = 20, period, status } = req.query;
    const q = { isDeleted: false };
    if (period) q.period = period;
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      GSTAdjustment.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      GSTAdjustment.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createAdjustment = async (req, res) => {
  try {
    const doc = await GSTAdjustment.create({ ...req.body, createdBy: req.user._id });
    return created(res, doc, 'GST adjustment created');
  } catch (e) { return serverError(res, e); }
};

exports.approveAdjustment = async (req, res) => {
  try {
    const doc = await GSTAdjustment.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'GST adjustment');
    doc.status     = 'approved';
    doc.approvedBy = req.user._id;
    await doc.save();
    return ok(res, doc, 'Adjustment approved');
  } catch (e) { return serverError(res, e); }
};

// ── ITC Ledger ────────────────────────────────────────────────────────────────

exports.getITCLedger = async (req, res) => {
  try {
    const { page = 1, limit = 20, period, taxHead } = req.query;
    const q = { isDeleted: false };
    if (period)  q.period  = period;
    if (taxHead) q.taxHead = taxHead;
    const [data, total] = await Promise.all([
      GSTInputCreditLedger.find(q).sort({ entryDate: -1 }).skip((page-1)*limit).limit(Number(limit)),
      GSTInputCreditLedger.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createITCEntry = async (req, res) => {
  try {
    const doc = await GSTInputCreditLedger.create(req.body);
    return created(res, doc, 'ITC ledger entry created');
  } catch (e) { return serverError(res, e); }
};

// ── Output Tax Ledger ─────────────────────────────────────────────────────────

exports.getOutputTaxLedger = async (req, res) => {
  try {
    const { page = 1, limit = 20, period, taxHead } = req.query;
    const q = { isDeleted: false };
    if (period)  q.period  = period;
    if (taxHead) q.taxHead = taxHead;
    const [data, total] = await Promise.all([
      GSTOutputTaxLedger.find(q).sort({ entryDate: -1 }).skip((page-1)*limit).limit(Number(limit)),
      GSTOutputTaxLedger.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createOutputTaxEntry = async (req, res) => {
  try {
    const doc = await GSTOutputTaxLedger.create(req.body);
    return created(res, doc, 'Output tax ledger entry created');
  } catch (e) { return serverError(res, e); }
};

// ── GST Settlement ────────────────────────────────────────────────────────────

exports.getSettlements = async (req, res) => {
  try {
    const { page = 1, limit = 20, period, status } = req.query;
    const q = { isDeleted: false };
    if (period) q.period = period;
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      GSTSettlement.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      GSTSettlement.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getSettlement = async (req, res) => {
  try {
    const doc = await GSTSettlement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'GST settlement');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createSettlement = async (req, res) => {
  try {
    const doc = await GSTSettlement.create({ ...req.body, settledBy: req.user._id });
    return created(res, doc, 'GST settlement created');
  } catch (e) { return serverError(res, e); }
};

exports.settleGST = async (req, res) => {
  try {
    const doc = await GSTSettlement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'GST settlement');
    doc.status        = 'paid';
    doc.challanNumber = req.body.challanNumber || '';
    doc.challanDate   = req.body.challanDate ? new Date(req.body.challanDate) : new Date();
    doc.totalPaid     = doc.totalPayable;
    doc.settledBy     = req.user._id;
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('tax:gst_settled', { settlementId: doc._id, settlementNumber: doc.settlementNumber, period: doc.period, totalPaid: doc.totalPaid });
    return ok(res, doc, 'GST settled');
  } catch (e) { return serverError(res, e); }
};

// ── ITC Register (from existing GSTInputCredit) ───────────────────────────────

exports.getInputCreditRegister = async (req, res) => {
  try {
    const { page = 1, limit = 20, period, search } = req.query;
    const q = { isDeleted: false };
    if (period) q.filedPeriod = period;
    if (search) q.$or = [{ vendorName: { $regex: search, $options: 'i' } }, { creditNumber: { $regex: search, $options: 'i' } }];
    const [data, total] = await Promise.all([
      GSTInputCredit.find(q).sort({ billDate: -1 }).skip((page-1)*limit).limit(Number(limit)).populate('vendor','name'),
      GSTInputCredit.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};
