const FiscalYear       = require('../models/FiscalYear');
const AccountingPeriod = require('../models/AccountingPeriod');
const AuditLog         = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Fiscal Years ───────────────────────────────────────────────────────────────

exports.getFiscalYears = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [data, total] = await Promise.all([
      FiscalYear.find({ isDeleted: false }).sort({ startDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      FiscalYear.countDocuments({ isDeleted: false }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getFiscalYear = async (req, res) => {
  try {
    const doc = await FiscalYear.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Fiscal year');
    const periods = await AccountingPeriod.find({ fiscalYear: doc._id, isDeleted: false }).sort({ periodNumber: 1 });
    return ok(res, { ...doc.toObject(), periods });
  } catch (e) { return serverError(res, e); }
};

exports.createFiscalYear = async (req, res) => {
  try {
    const doc = await FiscalYear.create(req.body);
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'FiscalYear', entityId: doc._id, entityLabel: doc.name, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Fiscal year created');
  } catch (e) { return serverError(res, e); }
};

exports.updateFiscalYear = async (req, res) => {
  try {
    const doc = await FiscalYear.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Fiscal year');
    if (doc.status === 'locked') return fail(res, 'Cannot edit a locked fiscal year');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Fiscal year updated');
  } catch (e) { return serverError(res, e); }
};

exports.closeFiscalYear = async (req, res) => {
  try {
    const doc = await FiscalYear.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Fiscal year');
    if (doc.status !== 'open') return fail(res, `Fiscal year is already ${doc.status}`);
    doc.status   = 'closed';
    doc.closedAt = new Date();
    doc.closedBy = req.admin._id;
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:year_closed', { fiscalYearId: doc._id, name: doc.name });
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CLOSE', entity: 'FiscalYear', entityId: doc._id, entityLabel: doc.name, changes: { before: { status: 'open' }, after: { status: 'closed' } }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc, 'Fiscal year closed');
  } catch (e) { return serverError(res, e); }
};

exports.lockFiscalYear = async (req, res) => {
  try {
    const doc = await FiscalYear.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Fiscal year');
    if (doc.status === 'open') return fail(res, 'Close the fiscal year before locking');
    doc.status = 'locked';
    await doc.save();
    return ok(res, doc, 'Fiscal year locked');
  } catch (e) { return serverError(res, e); }
};

exports.deleteFiscalYear = async (req, res) => {
  try {
    const doc = await FiscalYear.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Fiscal year');
    if (doc.status !== 'open') return fail(res, 'Cannot delete a closed or locked fiscal year');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Fiscal year deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Accounting Periods ─────────────────────────────────────────────────────────

exports.getPeriods = async (req, res) => {
  try {
    const { fiscalYear, page = 1, limit = 20 } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    const [data, total] = await Promise.all([
      AccountingPeriod.find(q).populate('fiscalYear','name yearCode').sort({ fiscalYear: 1, periodNumber: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      AccountingPeriod.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createPeriod = async (req, res) => {
  try {
    const doc = await AccountingPeriod.create(req.body);
    return created(res, doc, 'Accounting period created');
  } catch (e) { return serverError(res, e); }
};

exports.closePeriod = async (req, res) => {
  try {
    const doc = await AccountingPeriod.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Accounting period');
    if (doc.status !== 'open') return fail(res, `Period is already ${doc.status}`);
    doc.status   = 'closed';
    doc.closedAt = new Date();
    doc.closedBy = req.admin._id;
    await doc.save();
    const io = req.app.locals.io;
    if (io) io.emit('finance:fiscal_closed', { periodId: doc._id, periodName: doc.periodName });
    return ok(res, doc, 'Period closed');
  } catch (e) { return serverError(res, e); }
};

exports.lockPeriod = async (req, res) => {
  try {
    const doc = await AccountingPeriod.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Accounting period');
    if (doc.status === 'open') return fail(res, 'Close the period before locking');
    doc.status = 'locked';
    await doc.save();
    return ok(res, doc, 'Period locked');
  } catch (e) { return serverError(res, e); }
};

exports.updatePeriod = async (req, res) => {
  try {
    const doc = await AccountingPeriod.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Accounting period');
    if (doc.status === 'locked') return fail(res, 'Cannot edit a locked period');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Period updated');
  } catch (e) { return serverError(res, e); }
};
