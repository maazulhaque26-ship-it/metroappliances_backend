'use strict';
const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');

const TE  = () => mongoose.model('TimeEntry');
const TS  = () => mongoose.model('Timesheet');
const RES = () => mongoose.model('ProjectResource');

// ── Time Entries ──────────────────────────────────────────────────────────────

exports.listTimeEntries = async (req, res) => {
  try {
    const { employee, page = 1, limit = 50 } = req.query;
    const filter = { project: req.params.id, isDeleted: false };
    if (employee) filter.employee = employee;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      TE().find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit))
        .populate('employee', 'name').populate('task', 'title taskCode').lean(),
      TE().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) { return serverError(res, err); }
};

exports.createTimeEntry = async (req, res) => {
  try {
    const doc = await TE().create({ ...req.body, project: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateTimeEntry = async (req, res) => {
  try {
    const doc = await TE().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!doc) return notFound(res, 'Time entry not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteTimeEntry = async (req, res) => {
  try {
    const doc = await TE().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Time entry not found');
    return ok(res, { message: 'Time entry deleted' });
  } catch (err) { return serverError(res, err); }
};

// ── Timesheets ────────────────────────────────────────────────────────────────

exports.listTimesheets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (req.params.id && req.params.id !== 'summary') {
      // per-project: no direct project field on timesheet; filter via TimeEntry
      const employeeIds = await TE().distinct('employee', { project: req.params.id, isDeleted: false });
      filter.employee = { $in: employeeIds };
    }
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      TS().find(filter).sort({ weekStart: -1 }).skip(skip).limit(Number(limit))
        .populate('employee', 'name').populate('approvedBy', 'name').lean(),
      TS().countDocuments(filter),
    ]);
    return paginated(res, docs, Number(page), Number(limit), total);
  } catch (err) { return serverError(res, err); }
};

exports.createTimesheet = async (req, res) => {
  try {
    const doc = await TS().create(req.body);
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateTimesheet = async (req, res) => {
  try {
    const doc = await TS().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Timesheet not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.submitTimesheet = async (req, res) => {
  try {
    const doc = await TS().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'draft' },
      { status: 'submitted', submittedAt: new Date() },
      { new: true }
    );
    if (!doc) return notFound(res, 'Timesheet not found or already submitted');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.approveTimesheet = async (req, res) => {
  try {
    const doc = await TS().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'submitted' },
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!doc) return notFound(res, 'Timesheet not found or not submitted');
    await TE().updateMany({ timesheet: doc._id }, { approved: true, approvedBy: req.user._id });
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.rejectTimesheet = async (req, res) => {
  try {
    const doc = await TS().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'submitted' },
      { status: 'rejected', rejectedReason: req.body.reason || '' },
      { new: true }
    );
    if (!doc) return notFound(res, 'Timesheet not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getTimesheetSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { isDeleted: false };
    if (startDate) match.date = { $gte: new Date(startDate) };
    if (endDate) match.date = { ...(match.date || {}), $lte: new Date(endDate) };
    const rows = await TE().aggregate([
      { $match: match },
      { $group: {
          _id: '$employee',
          totalHours: { $sum: '$hours' },
          billableHours: { $sum: { $cond: ['$billable', '$hours', 0] } },
          entries: { $sum: 1 },
      }},
      { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
      { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } },
      { $project: { employee: '$emp.name', totalHours: 1, billableHours: 1, entries: 1 } },
    ]);
    return ok(res, rows);
  } catch (err) { return serverError(res, err); }
};

// ── Resources ─────────────────────────────────────────────────────────────────

exports.listResources = async (req, res) => {
  try {
    const docs = await RES().find({ project: req.params.id, isDeleted: false })
      .populate('employee', 'name email department').lean();
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};

exports.createResource = async (req, res) => {
  try {
    const doc = await RES().create({ ...req.body, project: req.params.id });
    return created(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateResource = async (req, res) => {
  try {
    const doc = await RES().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!doc) return notFound(res, 'Resource not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.deleteResource = async (req, res) => {
  try {
    const doc = await RES().findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Resource not found');
    return ok(res, { message: 'Resource removed' });
  } catch (err) { return serverError(res, err); }
};
