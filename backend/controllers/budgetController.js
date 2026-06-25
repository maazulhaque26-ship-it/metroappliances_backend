'use strict';
const Budget         = require('../models/Budget');
const BudgetLine     = require('../models/BudgetLine');
const BudgetScenario = require('../models/BudgetScenario');
const AuditLog       = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, fail, serverError } = require('../utils/response');

const logAudit = (req, action, entity, entityId, entityLabel, before, after) =>
  AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action, entity, entityId, entityLabel, changes: { before, after }, ip: req.ip, userAgent: req.get('user-agent') }).catch(() => {});

// ── Budgets ───────────────────────────────────────────────────────────────────
exports.getBudgets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, budgetType, department, fiscalYear } = req.query;
    const filter = { isDeleted: false };
    if (status)     filter.status     = status;
    if (budgetType) filter.budgetType = budgetType;
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (fiscalYear) filter.fiscalYear = fiscalYear;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Budget.countDocuments(filter);
    const data  = await Budget.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('fiscalYear', 'name yearCode').populate('approvedBy', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getBudget = async (req, res) => {
  try {
    const doc = await Budget.findOne({ _id: req.params.id, isDeleted: false })
      .populate('fiscalYear', 'name yearCode').populate('approvedBy', 'name');
    if (!doc) return notFound(res, 'Budget');
    const lines = await BudgetLine.find({ budget: doc._id, isDeleted: false }).sort({ category: 1 });
    return ok(res, { budget: doc, lines });
  } catch (err) { return serverError(res, err); }
};

exports.createBudget = async (req, res) => {
  try {
    const doc = await Budget.create(req.body);
    logAudit(req, 'BUDGET_CREATED', 'Budget', doc._id, doc.budgetName, null, doc.toObject());
    const io = req.app.locals.io;
    if (io) io.emit('cfo:budget_created', { budget: { _id: doc._id, budgetName: doc.budgetName, totalBudget: doc.totalBudget } });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateBudget = async (req, res) => {
  try {
    const doc = await Budget.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Budget');
    if (doc.status === 'locked') return fail(res, 'Budget is locked and cannot be modified');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    logAudit(req, 'BUDGET_UPDATED', 'Budget', doc._id, doc.budgetName, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.approveBudget = async (req, res) => {
  try {
    const doc = await Budget.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Budget');
    const before = doc.toObject();
    doc.status     = 'approved';
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    await doc.save();
    logAudit(req, 'BUDGET_APPROVED', 'Budget', doc._id, doc.budgetName, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.lockBudget = async (req, res) => {
  try {
    const doc = await Budget.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Budget');
    if (doc.status !== 'approved') return fail(res, 'Only approved budgets can be locked');
    const before = doc.toObject();
    doc.status   = 'locked';
    doc.lockedAt = new Date();
    await doc.save();
    logAudit(req, 'BUDGET_LOCKED', 'Budget', doc._id, doc.budgetName, before, doc.toObject());
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.reviseBudget = async (req, res) => {
  try {
    const orig = await Budget.findOne({ _id: req.params.id, isDeleted: false });
    if (!orig) return notFound(res, 'Budget');
    const revised = await Budget.create({
      ...orig.toObject(),
      _id:          undefined,
      budgetNumber: undefined,
      status:       'draft',
      revision:     (orig.revision || 1) + 1,
      parentBudget: orig._id,
      approvedBy:   undefined,
      approvedAt:   undefined,
      lockedAt:     undefined,
      ...req.body,
    });
    logAudit(req, 'BUDGET_REVISED', 'Budget', revised._id, revised.budgetName, null, revised.toObject());
    return created(res, revised);
  } catch (err) { return serverError(res, err); }
};

exports.deleteBudget = async (req, res) => {
  try {
    const doc = await Budget.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Budget');
    if (doc.status === 'locked') return fail(res, 'Locked budgets cannot be deleted');
    doc.isDeleted = true; await doc.save();
    logAudit(req, 'BUDGET_DELETED', 'Budget', doc._id, doc.budgetName, doc.toObject(), null);
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Budget Lines ──────────────────────────────────────────────────────────────
exports.getBudgetLines = async (req, res) => {
  try {
    const lines = await BudgetLine.find({ budget: req.params.id, isDeleted: false })
      .sort({ category: 1, accountCode: 1 }).populate('account', 'accountName accountCode');
    return ok(res, lines);
  } catch (err) { return serverError(res, err); }
};

exports.createBudgetLine = async (req, res) => {
  try {
    const line = await BudgetLine.create({ ...req.body, budget: req.params.id });
    return created(res, line);
  } catch (err) { return serverError(res, err); }
};

exports.updateBudgetLine = async (req, res) => {
  try {
    const line = await BudgetLine.findOneAndUpdate(
      { _id: req.params.lineId, isDeleted: false },
      req.body, { new: true }
    );
    if (!line) return notFound(res, 'BudgetLine');
    return ok(res, line);
  } catch (err) { return serverError(res, err); }
};

exports.deleteBudgetLine = async (req, res) => {
  try {
    const line = await BudgetLine.findOneAndUpdate(
      { _id: req.params.lineId, isDeleted: false },
      { isDeleted: true }, { new: true }
    );
    if (!line) return notFound(res, 'BudgetLine');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Budget Scenarios ──────────────────────────────────────────────────────────
exports.getScenarios = async (req, res) => {
  try {
    const docs = await BudgetScenario.find({ isDeleted: false }).sort({ createdAt: -1 })
      .populate('budget', 'budgetName budgetNumber').populate('fiscalYear', 'name');
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createScenario = async (req, res) => {
  try {
    const doc = await BudgetScenario.create(req.body);
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateScenario = async (req, res) => {
  try {
    const doc = await BudgetScenario.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'BudgetScenario');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteScenario = async (req, res) => {
  try {
    const doc = await BudgetScenario.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'BudgetScenario');
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ── Budget Variance ───────────────────────────────────────────────────────────
exports.getBudgetVariance = async (req, res) => {
  try {
    const { fiscalYear, department } = req.query;
    const filter = { isDeleted: false, status: { $in: ['approved','locked'] } };
    if (fiscalYear)  filter.fiscalYear = fiscalYear;
    if (department)  filter.department = { $regex: department, $options: 'i' };
    const budgets = await Budget.find(filter).sort({ period: 1 })
      .select('budgetName period budgetType totalBudget totalActual variance variancePct department');
    const io = req.app.locals.io;
    const overrun = budgets.find(b => b.variancePct < -10);
    if (io && overrun) io.emit('cfo:budget_exceeded', { budget: { _id: overrun._id, budgetName: overrun.budgetName, variancePct: overrun.variancePct } });
    return ok(res, budgets);
  } catch (err) { return serverError(res, err); }
};
