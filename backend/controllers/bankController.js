const Bank        = require('../models/Bank');
const BankBranch  = require('../models/BankBranch');
const AuditLog    = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent } = require('../utils/response');

// ── Banks ─────────────────────────────────────────────────────────────────────

exports.getBanks = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const q = { isDeleted: false };
    if (search) q.$or = [{ bankName: { $regex: search, $options: 'i' } }, { bankCode: { $regex: search, $options: 'i' } }];
    const [data, total] = await Promise.all([
      Bank.find(q).sort({ bankName: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      Bank.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createBank = async (req, res) => {
  try {
    const doc = await Bank.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'BANK_CREATED', entity: 'Bank', entityId: doc._id, entityLabel: doc.bankName, changes: { before: null, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Bank created');
  } catch (e) { return serverError(res, e); }
};

exports.updateBank = async (req, res) => {
  try {
    const old = await Bank.findOne({ _id: req.params.id, isDeleted: false });
    if (!old) return notFound(res, 'Bank');
    const doc = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'BANK_UPDATED', entity: 'Bank', entityId: doc._id, entityLabel: doc.bankName, changes: { before: old, after: doc }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteBank = async (req, res) => {
  try {
    const doc = await Bank.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Bank');
    return noContent(res, 'Bank deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Bank Branches ─────────────────────────────────────────────────────────────

exports.getBranches = async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.bank) q.bank = req.query.bank;
    if (req.query.search) q.$or = [{ branchName: { $regex: req.query.search, $options: 'i' } }, { ifscCode: { $regex: req.query.search, $options: 'i' } }];
    const data = await BankBranch.find(q).sort({ branchName: 1 }).populate('bank', 'bankName bankCode');
    return ok(res, data);
  } catch (e) { return serverError(res, e); }
};

exports.createBranch = async (req, res) => {
  try {
    const doc = await BankBranch.create(req.body);
    return created(res, doc, 'Branch created');
  } catch (e) { return serverError(res, e); }
};

exports.updateBranch = async (req, res) => {
  try {
    const doc = await BankBranch.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Branch');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.deleteBranch = async (req, res) => {
  try {
    const doc = await BankBranch.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Branch');
    return noContent(res, 'Branch deleted');
  } catch (e) { return serverError(res, e); }
};
