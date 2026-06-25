const Investment     = require('../models/Investment');
const FixedDeposit   = require('../models/FixedDeposit');
const InterestPosting= require('../models/InterestPosting');
const AuditLog       = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Investments ───────────────────────────────────────────────────────────────

exports.getInvestments = async (req, res) => {
  try {
    const { page = 1, limit = 20, investmentType, status } = req.query;
    const q = { isDeleted: false };
    if (investmentType) q.investmentType = investmentType;
    if (status)         q.status         = status;
    const [data, total] = await Promise.all([
      Investment.find(q).sort({ purchaseDate: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      Investment.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getInvestment = async (req, res) => {
  try {
    const doc = await Investment.findOne({ _id: req.params.id, isDeleted: false }).populate('bankAccount', 'accountName');
    if (!doc) return notFound(res, 'Investment');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createInvestment = async (req, res) => {
  try {
    const doc = await Investment.create({ ...req.body, currentValue: req.body.principalAmount || 0 });
    const io = req.app.locals.io;
    if (io) io.emit('bank:investment_created', { investmentNumber: doc.investmentNumber, investmentType: doc.investmentType, principalAmount: doc.principalAmount });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'INVESTMENT_CREATED', entity: 'Investment', entityId: doc._id, entityLabel: doc.investmentNumber, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Investment created');
  } catch (e) { return serverError(res, e); }
};

exports.updateInvestment = async (req, res) => {
  try {
    const doc = await Investment.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Investment');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.redeemInvestment = async (req, res) => {
  try {
    const { redemptionAmount, redemptionDate } = req.body;
    const doc = await Investment.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Investment');
    if (doc.status !== 'active') return fail(res, 'Only active investments can be redeemed');
    doc.status           = 'redeemed';
    doc.redemptionDate   = redemptionDate || new Date();
    doc.redemptionAmount = redemptionAmount || doc.currentValue;
    doc.actualReturn     = (doc.redemptionAmount - doc.principalAmount);
    await doc.save();
    return ok(res, doc, 'Investment redeemed');
  } catch (e) { return serverError(res, e); }
};

exports.deleteInvestment = async (req, res) => {
  try {
    const doc = await Investment.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Investment');
    return noContent(res, 'Investment deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Fixed Deposits ────────────────────────────────────────────────────────────

exports.getFixedDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, bankAccount } = req.query;
    const q = { isDeleted: false };
    if (status)      q.status      = status;
    if (bankAccount) q.bankAccount = bankAccount;
    const [data, total] = await Promise.all([
      FixedDeposit.find(q).sort({ maturityDate: 1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('bankAccount', 'accountName accountNumber'),
      FixedDeposit.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getFixedDeposit = async (req, res) => {
  try {
    const doc = await FixedDeposit.findOne({ _id: req.params.id, isDeleted: false }).populate('bankAccount', 'accountName');
    if (!doc) return notFound(res, 'Fixed deposit');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createFixedDeposit = async (req, res) => {
  try {
    const { principalAmount = 0, interestRate = 0, startDate, maturityDate } = req.body;
    const start    = new Date(startDate);
    const maturity = new Date(maturityDate);
    const tenureDays = Math.round((maturity - start) / 86400000);
    const maturityAmount = principalAmount * Math.pow(1 + (interestRate / 400), (tenureDays / 91.25));
    const doc = await FixedDeposit.create({ ...req.body, tenureDays, maturityAmount: Math.round(maturityAmount * 100) / 100 });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'FD_CREATED', entity: 'FixedDeposit', entityId: doc._id, entityLabel: doc.fdNumber, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Fixed deposit created');
  } catch (e) { return serverError(res, e); }
};

exports.updateFixedDeposit = async (req, res) => {
  try {
    const doc = await FixedDeposit.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Fixed deposit');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.closeFixedDeposit = async (req, res) => {
  try {
    const { closedAmount, closedDate, tdsDeducted, premature } = req.body;
    const doc = await FixedDeposit.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Fixed deposit');
    if (doc.status !== 'active') return fail(res, 'Only active FDs can be closed');
    doc.status      = premature ? 'prematurely_closed' : 'matured';
    doc.closedDate  = closedDate || new Date();
    doc.closedAmount= closedAmount || doc.maturityAmount;
    doc.tdsDeducted = tdsDeducted || 0;
    await doc.save();
    return ok(res, doc, 'Fixed deposit closed');
  } catch (e) { return serverError(res, e); }
};

exports.deleteFixedDeposit = async (req, res) => {
  try {
    const doc = await FixedDeposit.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Fixed deposit');
    return noContent(res, 'Fixed deposit deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Interest Postings (reuse from bankAccountController) ─────────────────────
// Exposed via investmentController for FD-specific interest postings

exports.getFDInterestPostings = async (req, res) => {
  try {
    const data = await InterestPosting.find({ fixedDeposit: req.params.id, isDeleted: false }).sort({ postingDate: -1 });
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};
