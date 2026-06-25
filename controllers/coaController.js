const ChartOfAccount  = require('../models/ChartOfAccount');
const AccountGroup    = require('../models/AccountGroup');
const AuditLog        = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── Chart of Accounts ─────────────────────────────────────────────────────────

exports.getAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', accountType, accountGroup, postingAllowed, isActive = 'true' } = req.query;
    const q = { isDeleted: false };
    if (search)        q.$or = [{ accountCode: { $regex: search, $options: 'i' } }, { accountName: { $regex: search, $options: 'i' } }];
    if (accountType)   q.accountType = accountType;
    if (accountGroup)  q.accountGroup = accountGroup;
    if (postingAllowed !== undefined) q.postingAllowed = postingAllowed === 'true';
    if (isActive !== '')  q.isActive = isActive === 'true';
    const [data, total] = await Promise.all([
      ChartOfAccount.find(q).populate('accountGroup','groupCode groupName').populate('parentAccount','accountCode accountName').sort({ accountCode: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      ChartOfAccount.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getAccount = async (req, res) => {
  try {
    const doc = await ChartOfAccount.findOne({ _id: req.params.id, isDeleted: false }).populate('accountGroup').populate('parentAccount','accountCode accountName');
    if (!doc) return notFound(res, 'Account');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createAccount = async (req, res) => {
  try {
    const doc = await ChartOfAccount.create(req.body);
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'ChartOfAccount', entityId: doc._id, entityLabel: doc.accountName, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Account created');
  } catch (e) { return serverError(res, e); }
};

exports.updateAccount = async (req, res) => {
  try {
    const doc = await ChartOfAccount.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Account');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'UPDATE', entity: 'ChartOfAccount', entityId: doc._id, entityLabel: doc.accountName, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc, 'Account updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteAccount = async (req, res) => {
  try {
    const doc = await ChartOfAccount.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Account');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Account deleted');
  } catch (e) { return serverError(res, e); }
};

exports.getAccountTree = async (req, res) => {
  try {
    const accounts = await ChartOfAccount.find({ isDeleted: false, isActive: true }).sort({ accountCode: 1 }).lean();
    const map = {};
    accounts.forEach(a => { map[a._id] = { ...a, children: [] }; });
    const roots = [];
    accounts.forEach(a => {
      if (a.parentAccount && map[a.parentAccount]) map[a.parentAccount].children.push(map[a._id]);
      else roots.push(map[a._id]);
    });
    return ok(res, roots, 'Account tree');
  } catch (e) { return serverError(res, e); }
};

// ── Account Groups ─────────────────────────────────────────────────────────────

exports.getGroups = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [data, total] = await Promise.all([
      AccountGroup.find({ isDeleted: false }).sort({ groupCode: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      AccountGroup.countDocuments({ isDeleted: false }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.createGroup = async (req, res) => {
  try {
    const doc = await AccountGroup.create(req.body);
    return created(res, doc, 'Account group created');
  } catch (e) { return serverError(res, e); }
};

exports.updateGroup = async (req, res) => {
  try {
    const doc = await AccountGroup.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!doc) return notFound(res, 'Account group');
    return ok(res, doc, 'Account group updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteGroup = async (req, res) => {
  try {
    const doc = await AccountGroup.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Account group');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Account group deleted');
  } catch (e) { return serverError(res, e); }
};
