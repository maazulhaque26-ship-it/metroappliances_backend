const PostingRule     = require('../models/PostingRule');
const PostingTemplate = require('../models/PostingTemplate');
const VoucherSeries   = require('../models/VoucherSeries');
const Voucher         = require('../models/Voucher');
const CostCenter      = require('../models/CostCenter');
const ProfitCenter    = require('../models/ProfitCenter');
const AccountingDimension = require('../models/AccountingDimension');
const AuditLog        = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Posting Rules ──────────────────────────────────────────────────────────────

exports.getRules = async (req, res) => {
  try {
    const { page = 1, limit = 50, sourceModule } = req.query;
    const q = { isDeleted: false };
    if (sourceModule) q.sourceModule = sourceModule;
    const [data, total] = await Promise.all([
      PostingRule.find(q).populate('debitAccount','accountCode accountName').populate('creditAccount','accountCode accountName').sort({ ruleCode: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      PostingRule.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createRule = async (req, res) => {
  try {
    const doc = await PostingRule.create(req.body);
    return created(res, doc, 'Posting rule created');
  } catch (e) { return serverError(res, e); }
};

exports.updateRule = async (req, res) => {
  try {
    const doc = await PostingRule.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Posting rule');
    return ok(res, doc, 'Posting rule updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteRule = async (req, res) => {
  try {
    const doc = await PostingRule.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Posting rule');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Posting rule deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Posting Templates ──────────────────────────────────────────────────────────

exports.getTemplates = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [data, total] = await Promise.all([
      PostingTemplate.find({ isDeleted: false }).sort({ templateCode: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      PostingTemplate.countDocuments({ isDeleted: false }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createTemplate = async (req, res) => {
  try {
    const doc = await PostingTemplate.create(req.body);
    return created(res, doc, 'Template created');
  } catch (e) { return serverError(res, e); }
};

exports.updateTemplate = async (req, res) => {
  try {
    const doc = await PostingTemplate.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Template');
    return ok(res, doc, 'Template updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const doc = await PostingTemplate.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Template');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Template deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Voucher Series ─────────────────────────────────────────────────────────────

exports.getVoucherSeries = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [data, total] = await Promise.all([
      VoucherSeries.find({ isDeleted: false }).populate('fiscalYear','name').sort({ voucherType: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      VoucherSeries.countDocuments({ isDeleted: false }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createVoucherSeries = async (req, res) => {
  try {
    const doc = await VoucherSeries.create(req.body);
    return created(res, doc, 'Voucher series created');
  } catch (e) { return serverError(res, e); }
};

exports.updateVoucherSeries = async (req, res) => {
  try {
    const doc = await VoucherSeries.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Voucher series');
    return ok(res, doc, 'Voucher series updated');
  } catch (e) { return serverError(res, e); }
};

// ── Vouchers ───────────────────────────────────────────────────────────────────

exports.getVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 20, voucherType, status, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (voucherType) q.voucherType = voucherType;
    if (status)      q.status      = status;
    if (startDate || endDate) {
      q.voucherDate = {};
      if (startDate) q.voucherDate.$gte = new Date(startDate);
      if (endDate)   q.voucherDate.$lte = new Date(endDate);
    }
    const [data, total] = await Promise.all([
      Voucher.find(q).sort({ voucherDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Voucher.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getVoucher = async (req, res) => {
  try {
    const doc = await Voucher.findOne({ _id: req.params.id, isDeleted: false }).populate('journalEntry');
    if (!doc) return notFound(res, 'Voucher');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createVoucher = async (req, res) => {
  try {
    const doc = await Voucher.create({ ...req.body, createdBy: req.admin._id });
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'Voucher', entityId: doc._id, entityLabel: doc.voucherNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Voucher created');
  } catch (e) { return serverError(res, e); }
};

exports.updateVoucher = async (req, res) => {
  try {
    const doc = await Voucher.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Voucher');
    if (doc.status === 'posted') return fail(res, 'Cannot edit a posted voucher');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Voucher updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const doc = await Voucher.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Voucher');
    if (doc.status === 'posted') return fail(res, 'Cannot delete a posted voucher');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Voucher deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Cost Centers ───────────────────────────────────────────────────────────────

exports.getCostCenters = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [data, total] = await Promise.all([
      CostCenter.find({ isDeleted: false }).sort({ centerCode: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      CostCenter.countDocuments({ isDeleted: false }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createCostCenter = async (req, res) => {
  try {
    const doc = await CostCenter.create(req.body);
    return created(res, doc, 'Cost center created');
  } catch (e) { return serverError(res, e); }
};

exports.updateCostCenter = async (req, res) => {
  try {
    const doc = await CostCenter.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Cost center');
    return ok(res, doc, 'Cost center updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteCostCenter = async (req, res) => {
  try {
    const doc = await CostCenter.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Cost center');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Cost center deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Profit Centers ─────────────────────────────────────────────────────────────

exports.getProfitCenters = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [data, total] = await Promise.all([
      ProfitCenter.find({ isDeleted: false }).sort({ centerCode: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      ProfitCenter.countDocuments({ isDeleted: false }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createProfitCenter = async (req, res) => {
  try {
    const doc = await ProfitCenter.create(req.body);
    return created(res, doc, 'Profit center created');
  } catch (e) { return serverError(res, e); }
};

exports.updateProfitCenter = async (req, res) => {
  try {
    const doc = await ProfitCenter.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Profit center');
    return ok(res, doc, 'Profit center updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteProfitCenter = async (req, res) => {
  try {
    const doc = await ProfitCenter.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Profit center');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Profit center deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Accounting Dimensions ──────────────────────────────────────────────────────

exports.getDimensions = async (req, res) => {
  try {
    const [data, total] = await Promise.all([
      AccountingDimension.find({ isDeleted: false }).sort({ dimensionCode: 1 }),
      AccountingDimension.countDocuments({ isDeleted: false }),
    ]);
    return ok(res, { data, total });
  } catch (e) { return serverError(res, e); }
};

exports.createDimension = async (req, res) => {
  try {
    const doc = await AccountingDimension.create(req.body);
    return created(res, doc, 'Accounting dimension created');
  } catch (e) { return serverError(res, e); }
};

exports.updateDimension = async (req, res) => {
  try {
    const doc = await AccountingDimension.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Accounting dimension');
    return ok(res, doc, 'Dimension updated');
  } catch (e) { return serverError(res, e); }
};
