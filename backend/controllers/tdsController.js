'use strict';
const TDSSection     = require('../models/TDSSection');
const TDSRate        = require('../models/TDSRate');
const TDSCertificate = require('../models/TDSCertificate');
const TDSDeduction   = require('../models/TDSDeduction');
const TDSDeposit     = require('../models/TDSDeposit');
const AuditLog       = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── TDS Sections ──────────────────────────────────────────────────────────────

exports.getSections = async (req, res) => {
  try {
    const { isActive } = req.query;
    const q = { isDeleted: false };
    if (isActive !== undefined) q.isActive = isActive === 'true';
    const data = await TDSSection.find(q).sort({ section: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createSection = async (req, res) => {
  try {
    const doc = await TDSSection.create(req.body);
    return created(res, doc, 'TDS section created');
  } catch (e) { return serverError(res, e); }
};

exports.updateSection = async (req, res) => {
  try {
    const doc = await TDSSection.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'TDS section');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── TDS Rates ─────────────────────────────────────────────────────────────────

exports.getRates = async (req, res) => {
  try {
    const { section, isActive } = req.query;
    const q = { isDeleted: false };
    if (section)  q.section  = section;
    if (isActive !== undefined) q.isActive = isActive === 'true';
    const data = await TDSRate.find(q).sort({ section: 1, payeeType: 1 }).populate('tdsSection','section description');
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createRate = async (req, res) => {
  try {
    const doc = await TDSRate.create(req.body);
    return created(res, doc, 'TDS rate created');
  } catch (e) { return serverError(res, e); }
};

// ── TDS Deductions ────────────────────────────────────────────────────────────

exports.getDeductions = async (req, res) => {
  try {
    const { page = 1, limit = 20, section, assessmentYear, quarter, status, search } = req.query;
    const q = { isDeleted: false };
    if (section)        q.section        = section;
    if (assessmentYear) q.assessmentYear  = assessmentYear;
    if (quarter)        q.quarter         = quarter;
    if (status)         q.status          = status;
    if (search)         q.$or = [{ partyName: { $regex: search, $options: 'i' } }, { deductionNumber: { $regex: search, $options: 'i' } }];
    const [data, total] = await Promise.all([
      TDSDeduction.find(q).sort({ deductionDate: -1 }).skip((page-1)*limit).limit(Number(limit)).populate('tdsSection','section description'),
      TDSDeduction.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getDeduction = async (req, res) => {
  try {
    const doc = await TDSDeduction.findOne({ _id: req.params.id, isDeleted: false }).populate('tdsSection');
    if (!doc) return notFound(res, 'TDS deduction');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createDeduction = async (req, res) => {
  try {
    const doc = await TDSDeduction.create({ ...req.body, createdBy: req.user._id });
    const io = req.app.locals.io;
    if (io) io.emit('tax:tds_deducted', { deductionId: doc._id, deductionNumber: doc.deductionNumber, section: doc.section, tdsAmount: doc.tdsAmount, partyName: doc.partyName });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'CREATE', entity: 'TDSDeduction', entityId: doc._id, entityLabel: doc.deductionNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'TDS deduction recorded');
  } catch (e) { return serverError(res, e); }
};

exports.updateDeduction = async (req, res) => {
  try {
    const doc = await TDSDeduction.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'TDS deduction');
    if (doc.status === 'deposited') return fail(res, 'Cannot edit deposited deduction');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteDeduction = async (req, res) => {
  try {
    const doc = await TDSDeduction.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'TDS deduction');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};

// ── TDS Deposits ──────────────────────────────────────────────────────────────

exports.getDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, assessmentYear, quarter, status } = req.query;
    const q = { isDeleted: false };
    if (assessmentYear) q.assessmentYear = assessmentYear;
    if (quarter)        q.quarter        = quarter;
    if (status)         q.status         = status;
    const [data, total] = await Promise.all([
      TDSDeposit.find(q).sort({ depositDate: -1 }).skip((page-1)*limit).limit(Number(limit)),
      TDSDeposit.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createDeposit = async (req, res) => {
  try {
    const doc = await TDSDeposit.create({ ...req.body, depositedBy: req.user._id });
    // Mark linked deductions as deposited
    if (req.body.deductions && req.body.deductions.length > 0) {
      await TDSDeduction.updateMany({ _id: { $in: req.body.deductions } }, { status: 'deposited', tdsDeposit: doc._id });
    }
    const io = req.app.locals.io;
    if (io) io.emit('tax:tds_deposited', { depositId: doc._id, depositNumber: doc.depositNumber, assessmentYear: doc.assessmentYear, quarter: doc.quarter, totalDeposited: doc.totalDeposited });
    return created(res, doc, 'TDS deposit created');
  } catch (e) { return serverError(res, e); }
};

exports.acknowledgeDeposit = async (req, res) => {
  try {
    const doc = await TDSDeposit.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'TDS deposit');
    doc.status = 'acknowledged';
    if (req.body.challanNumber) doc.challanNumber = req.body.challanNumber;
    await doc.save();
    return ok(res, doc, 'Deposit acknowledged');
  } catch (e) { return serverError(res, e); }
};

// ── TDS Certificates ──────────────────────────────────────────────────────────

exports.getCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 20, assessmentYear, quarter, status, search } = req.query;
    const q = { isDeleted: false };
    if (assessmentYear) q.assessmentYear = assessmentYear;
    if (quarter)        q.quarter        = quarter;
    if (status)         q.status         = status;
    if (search)         q.$or = [{ deducteeName: { $regex: search, $options: 'i' } }, { certificateNumber: { $regex: search, $options: 'i' } }];
    const [data, total] = await Promise.all([
      TDSCertificate.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      TDSCertificate.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createCertificate = async (req, res) => {
  try {
    const doc = await TDSCertificate.create(req.body);
    return created(res, doc, 'TDS certificate created');
  } catch (e) { return serverError(res, e); }
};

exports.issueCertificate = async (req, res) => {
  try {
    const doc = await TDSCertificate.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'TDS certificate');
    doc.status    = 'issued';
    doc.issueDate = new Date();
    await doc.save();
    return ok(res, doc, 'Certificate issued');
  } catch (e) { return serverError(res, e); }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const doc = await TDSCertificate.findOneAndUpdate({ _id: req.params.id, status: { $ne: 'issued' } }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'TDS certificate');
    return noContent(res);
  } catch (e) { return serverError(res, e); }
};
