const FinancialSetting = require('../models/FinancialSetting');
const Currency         = require('../models/Currency');
const ExchangeRate     = require('../models/ExchangeRate');
const OpeningBalance   = require('../models/OpeningBalance');
const ClosingBalance   = require('../models/ClosingBalance');
const AuditLog         = require('../models/AuditLog');
const { ok, created, serverError, notFound, noContent, paginated, fail } = require('../utils/response');

// ── Financial Settings ─────────────────────────────────────────────────────────

exports.getSettings = async (req, res) => {
  try {
    let doc = await FinancialSetting.findOne({ isDeleted: false }).populate('defaultCostCenter','centerCode name').populate('arAccount apAccount cashAccount bankAccount revenueAccount cogsAccount retainedEarnings','accountCode accountName');
    if (!doc) doc = await FinancialSetting.create({ company: 'Metro Appliances' });
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateSettings = async (req, res) => {
  try {
    let doc = await FinancialSetting.findOne({ isDeleted: false });
    if (!doc) { doc = await FinancialSetting.create({ company: 'Metro Appliances', ...req.body }); }
    else { Object.assign(doc, req.body); await doc.save(); }
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'UPDATE', entity: 'FinancialSetting', entityId: doc._id, entityLabel: doc.company, changes: { before: {}, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc, 'Financial settings updated');
  } catch (e) { return serverError(res, e); }
};

// ── Currencies ─────────────────────────────────────────────────────────────────

exports.getCurrencies = async (req, res) => {
  try {
    const data = await Currency.find({ isDeleted: false }).sort({ code: 1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createCurrency = async (req, res) => {
  try {
    const doc = await Currency.create(req.body);
    return created(res, doc, 'Currency created');
  } catch (e) { return serverError(res, e); }
};

exports.updateCurrency = async (req, res) => {
  try {
    const doc = await Currency.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Currency');
    return ok(res, doc, 'Currency updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteCurrency = async (req, res) => {
  try {
    const doc = await Currency.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Currency');
    if (doc.isBase) return fail(res, 'Cannot delete the base currency');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Currency deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Exchange Rates ─────────────────────────────────────────────────────────────

exports.getExchangeRates = async (req, res) => {
  try {
    const { page = 1, limit = 50, fromCurrency, toCurrency } = req.query;
    const q = { isDeleted: false };
    if (fromCurrency) q.fromCurrency = fromCurrency.toUpperCase();
    if (toCurrency)   q.toCurrency   = toCurrency.toUpperCase();
    const [data, total] = await Promise.all([
      ExchangeRate.find(q).sort({ effectiveDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      ExchangeRate.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createExchangeRate = async (req, res) => {
  try {
    const doc = await ExchangeRate.create(req.body);
    return created(res, doc, 'Exchange rate created');
  } catch (e) { return serverError(res, e); }
};

exports.updateExchangeRate = async (req, res) => {
  try {
    const doc = await ExchangeRate.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Exchange rate');
    return ok(res, doc, 'Exchange rate updated');
  } catch (e) { return serverError(res, e); }
};

// ── Opening Balances ───────────────────────────────────────────────────────────

exports.getOpeningBalances = async (req, res) => {
  try {
    const { fiscalYear, page = 1, limit = 50 } = req.query;
    const q = { isDeleted: false };
    if (fiscalYear) q.fiscalYear = fiscalYear;
    const [data, total] = await Promise.all([
      OpeningBalance.find(q).populate('account','accountCode accountName accountType').populate('fiscalYear','name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      OpeningBalance.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createOpeningBalance = async (req, res) => {
  try {
    const doc = await OpeningBalance.create(req.body);
    return created(res, doc, 'Opening balance created');
  } catch (e) { return serverError(res, e); }
};

exports.updateOpeningBalance = async (req, res) => {
  try {
    const doc = await OpeningBalance.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Opening balance');
    if (doc.isPosted) return fail(res, 'Cannot edit a posted opening balance');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Opening balance updated');
  } catch (e) { return serverError(res, e); }
};
