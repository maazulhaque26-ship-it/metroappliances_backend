'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const Goal              = () => mongoose.model('Goal');
const GoalProgress      = () => mongoose.model('GoalProgress');
const GoalCategory      = () => mongoose.model('GoalCategory');
const PerformanceCycle  = () => mongoose.model('PerformanceCycle');

function _audit(req, action, entity, id, label, before, after) {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        admin: req.user._id, adminName: req.user.name,
        adminEmail: req.user.email, adminRole: req.user.role,
        action, entity, entityId: id,
        entityLabel: String(label || '').slice(0, 200),
        changes: { before, after },
        ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
        userAgent: (req.get('User-Agent') || '').slice(0, 300),
      });
    } catch (_) {}
  });
}

// ── Goals ─────────────────────────────────────────────────────────────────────

exports.createGoal = async (req, res) => {
  try {
    const goal = await Goal().create(req.body);
    _audit(req, 'CREATE', 'Goal', goal._id, goal.goalNumber, null, req.body);
    req.io?.emit('hr:goal_created', { goalId: goal._id, goalNumber: goal.goalNumber });
    return created(res, goal, 'Goal created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getGoals = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { cycle, employee, status, category } = req.query;
    const filter = { isDeleted: false };
    if (cycle)    filter.cycle    = cycle;
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const [data, total] = await Promise.all([
      Goal().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('cycle', 'name cycleCode')
        .populate('category', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Goal().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal().findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'firstName lastName employeeCode department designation')
      .populate('cycle', 'name cycleCode status')
      .populate('category', 'name')
      .populate('approvedBy', 'name email')
      .lean();
    if (!goal) return notFound(res, 'Goal');
    return ok(res, goal);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal().findOne({ _id: req.params.id, isDeleted: false });
    if (!goal) return notFound(res, 'Goal');
    const before = goal.toObject();
    Object.assign(goal, req.body);
    await goal.save();
    _audit(req, 'UPDATE', 'Goal', goal._id, goal.goalNumber, before, req.body);
    return ok(res, goal, 'Goal updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal().findOne({ _id: req.params.id, isDeleted: false });
    if (!goal) return notFound(res, 'Goal');

    const hasProgress = await GoalProgress().countDocuments({ goal: goal._id });
    if (hasProgress > 0) {
      goal.isDeleted = true;
      await goal.save();
    } else {
      await Goal().deleteOne({ _id: goal._id });
    }
    _audit(req, 'DELETE', 'Goal', goal._id, goal.goalNumber, goal.toObject(), null);
    return ok(res, null, 'Goal deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.approveGoal = async (req, res) => {
  try {
    const goal = await Goal().findOne({ _id: req.params.id, isDeleted: false });
    if (!goal) return notFound(res, 'Goal');
    const before = goal.toObject();
    goal.isApproved = true;
    goal.approvedBy = req.user._id;
    if (goal.status === 'draft') goal.status = 'active';
    await goal.save();
    _audit(req, 'APPROVE', 'Goal', goal._id, goal.goalNumber, before, { isApproved: true });
    return ok(res, goal, 'Goal approved');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const goal = await Goal().findOne({ _id: req.params.id, isDeleted: false });
    if (!goal) return notFound(res, 'Goal');

    const { progressPercent, notes } = req.body;
    if (progressPercent === undefined) return fail(res, 'progressPercent is required');

    const pct = Math.min(100, Math.max(0, Number(progressPercent)));
    await GoalProgress().create({ goal: goal._id, employee: goal.employee, progressPercent: pct, notes });

    const before = goal.toObject();
    goal.progress = pct;
    if (pct === 100) {
      goal.status = 'achieved';
      goal.completedDate = new Date();
    }
    await goal.save();

    if (pct === 100) {
      req.io?.emit('hr:goal_completed', { goalId: goal._id, goalNumber: goal.goalNumber });
    }
    _audit(req, 'UPDATE', 'Goal', goal._id, goal.goalNumber, before, { progress: pct });
    return ok(res, goal, 'Progress updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Performance Cycles ────────────────────────────────────────────────────────

exports.createCycle = async (req, res) => {
  try {
    const cycle = await PerformanceCycle().create(req.body);
    _audit(req, 'CREATE', 'PerformanceCycle', cycle._id, cycle.cycleCode, null, req.body);
    return created(res, cycle, 'Performance cycle created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCycles = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, year } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (year)   filter.year   = Number(year);

    const [data, total] = await Promise.all([
      PerformanceCycle().find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PerformanceCycle().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCycle = async (req, res) => {
  try {
    const cycle = await PerformanceCycle().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!cycle) return notFound(res, 'Performance cycle');
    return ok(res, cycle);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateCycle = async (req, res) => {
  try {
    const cycle = await PerformanceCycle().findOne({ _id: req.params.id, isDeleted: false });
    if (!cycle) return notFound(res, 'Performance cycle');
    const before = cycle.toObject();
    Object.assign(cycle, req.body);
    await cycle.save();
    _audit(req, 'UPDATE', 'PerformanceCycle', cycle._id, cycle.cycleCode, before, req.body);
    return ok(res, cycle, 'Cycle updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteCycle = async (req, res) => {
  try {
    const cycle = await PerformanceCycle().findOne({ _id: req.params.id, isDeleted: false });
    if (!cycle) return notFound(res, 'Performance cycle');
    cycle.isDeleted = true;
    await cycle.save();
    _audit(req, 'DELETE', 'PerformanceCycle', cycle._id, cycle.cycleCode, cycle.toObject(), null);
    return ok(res, null, 'Cycle deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Goal Categories ───────────────────────────────────────────────────────────

exports.createGoalCategory = async (req, res) => {
  try {
    const cat = await GoalCategory().create(req.body);
    _audit(req, 'CREATE', 'GoalCategory', cat._id, cat.name, null, req.body);
    return created(res, cat, 'Goal category created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getGoalCategories = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const data = await GoalCategory().find(filter).sort({ name: 1 }).lean();
    return ok(res, data);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateGoalCategory = async (req, res) => {
  try {
    const cat = await GoalCategory().findOne({ _id: req.params.id, isDeleted: false });
    if (!cat) return notFound(res, 'Goal category');
    const before = cat.toObject();
    Object.assign(cat, req.body);
    await cat.save();
    _audit(req, 'UPDATE', 'GoalCategory', cat._id, cat.name, before, req.body);
    return ok(res, cat, 'Category updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteGoalCategory = async (req, res) => {
  try {
    const cat = await GoalCategory().findOne({ _id: req.params.id, isDeleted: false });
    if (!cat) return notFound(res, 'Goal category');
    cat.isDeleted = true;
    await cat.save();
    _audit(req, 'DELETE', 'GoalCategory', cat._id, cat.name, cat.toObject(), null);
    return ok(res, null, 'Category deleted');
  } catch (err) {
    return serverError(res, err);
  }
};
