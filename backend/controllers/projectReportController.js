'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');

const Proj  = () => mongoose.model('Project');
const PT    = () => mongoose.model('ProjectTask');
const MS    = () => mongoose.model('Milestone');
const TE    = () => mongoose.model('TimeEntry');
const RISK  = () => mongoose.model('ProjectRisk');
const ISS   = () => mongoose.model('ProjectIssue');
const BUD   = () => mongoose.model('ProjectBudget');
const COST  = () => mongoose.model('ProjectCost');
const RES   = () => mongoose.model('ProjectResource');
const CAL   = () => mongoose.model('ProjectCalendar');
const SET   = () => mongoose.model('ProjectSetting');
const NOTIF = () => mongoose.model('ProjectNotification');

// ── Reports ───────────────────────────────────────────────────────────────────

exports.getProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { isDeleted: false };
    if (projectId) filter._id = projectId;
    const projects = await Proj().find(filter).select('name completionPercent status').lean();
    return ok(res, projects);
  } catch (err) { return serverError(res, err); }
};

exports.getMilestoneStatus = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { isDeleted: false };
    if (projectId) filter.project = projectId;
    const rows = await mongoose.model('Milestone').aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

exports.getBudgetVsActual = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { isDeleted: false };
    if (projectId) filter.project = projectId;
    const [budgets, costs] = await Promise.all([
      BUD().find(filter).populate('project', 'name').lean(),
      COST().aggregate([
        { $match: { isDeleted: false, ...(projectId ? { project: new mongoose.Types.ObjectId(projectId) } : {}) } },
        { $group: { _id: '$project', totalCost: { $sum: '$amount' } } },
      ]),
    ]);
    const costMap = {};
    costs.forEach(c => { costMap[String(c._id)] = c.totalCost; });
    const result = budgets.map(b => ({
      project: b.project,
      totalBudget: b.totalBudget,
      actualCost: costMap[String(b.project?._id || b.project)] || 0,
    }));
    return ok(res, result);
  } catch (err) { return serverError(res, err); }
};

exports.getResourceUtilization = async (req, res) => {
  try {
    const { projectId } = req.query;
    const match = { isDeleted: false };
    if (projectId) match.project = new mongoose.Types.ObjectId(projectId);
    const rows = await TE().aggregate([
      { $match: match },
      { $group: { _id: '$employee', totalHours: { $sum: '$hours' }, billable: { $sum: { $cond: ['$billable', '$hours', 0] } } } },
      { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
      { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$emp.name', totalHours: 1, billable: 1 } },
    ]);
    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

exports.getTaskCompletion = async (req, res) => {
  try {
    const { projectId } = req.query;
    const match = { isDeleted: false };
    if (projectId) match.project = new mongoose.Types.ObjectId(projectId);
    const rows = await PT().aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

exports.getTimesheetSummary = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    const match = { isDeleted: false };
    if (projectId) match.project = new mongoose.Types.ObjectId(projectId);
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }
    const rows = await TE().aggregate([
      { $match: match },
      { $group: { _id: { project: '$project', employee: '$employee' }, totalHours: { $sum: '$hours' } } },
    ]);
    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

exports.getRiskReport = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { isDeleted: false };
    if (projectId) filter.project = projectId;
    const [open, byCategory] = await Promise.all([
      RISK().countDocuments({ ...filter, status: { $in: ['identified', 'assessed'] } }),
      RISK().aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$riskScore' } } },
      ]),
    ]);
    return ok(res, { openRisks: open, byCategory });
  } catch (err) { return serverError(res, err); }
};

exports.getIssueReport = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { isDeleted: false };
    if (projectId) filter.project = projectId;
    const rows = await ISS().aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

// ── Calendar ──────────────────────────────────────────────────────────────────

exports.listCalendarEvents = async (req, res) => {
  try {
    const docs = await CAL().find({ project: req.params.id, isDeleted: false })
      .sort({ startDate: 1 }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const doc = await CAL().create({ ...req.body, project: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateCalendarEvent = async (req, res) => {
  try {
    const doc = await CAL().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Event not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteCalendarEvent = async (req, res) => {
  try {
    const doc = await CAL().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Event not found');
    return ok(res, { message: 'Event deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Settings ──────────────────────────────────────────────────────────────────

exports.getProjectSettings = async (req, res) => {
  try {
    const docs = await SET().find({ isDeleted: false }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.updateProjectSettings = async (req, res) => {
  try {
    const { key, value, description, category } = req.body;
    const doc = await SET().findOneAndUpdate(
      { key },
      { value, description, category, updatedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

// ── Notifications ─────────────────────────────────────────────────────────────

exports.listProjectNotifications = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const filter = { recipient: req.user._id, isDeleted: false };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const docs = await NOTIF().find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

// ── Budget & Costs ────────────────────────────────────────────────────────────

exports.getProjectBudget = async (req, res) => {
  try {
    const doc = await BUD().findOne({ project: req.params.id, isDeleted: false }).lean();
    return ok(res, doc || {});
  } catch (err) { return serverError(res, err); }
};

exports.createProjectBudget = async (req, res) => {
  try {
    const doc = await BUD().create({ ...req.body, project: req.params.id, approvedBy: req.user._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateProjectBudget = async (req, res) => {
  try {
    const doc = await BUD().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Budget not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.listProjectCosts = async (req, res) => {
  try {
    const docs = await COST().find({ project: req.params.id, isDeleted: false })
      .sort({ date: -1 }).lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createProjectCost = async (req, res) => {
  try {
    const doc = await COST().create({ ...req.body, project: req.params.id, recordedBy: req.user._id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateProjectCost = async (req, res) => {
  try {
    const doc = await COST().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Cost not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};
