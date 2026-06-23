'use strict';
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const MaintenancePlan     = require('../models/MaintenancePlan');
const MaintenanceContract = require('../models/MaintenanceContract');
const AuditLog            = require('../models/AuditLog');
const { success, error, paginated, notFound, serverError } = require('../utils/response');

// ── Maintenance Schedules ─────────────────────────────────────────────────────

exports.getSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, assetId, planId, upcoming } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (assetId) filter.asset = assetId;
    if (planId) filter.maintenancePlan = planId;
    if (upcoming === 'true') {
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filter.scheduledDate = { $gte: now, $lte: in30 };
      filter.status = { $in: ['scheduled','overdue'] };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenanceSchedule.find(filter)
        .populate('asset', 'name assetNumber location')
        .populate('maintenancePlan', 'name planNumber maintenanceType')
        .populate('assignedTo', 'name email')
        .sort({ scheduledDate: 1 }).skip(skip).limit(Number(limit)),
      MaintenanceSchedule.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getSchedule = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOne({ _id: req.params.id, isDeleted: false })
      .populate('asset', 'name assetNumber')
      .populate('maintenancePlan', 'name planNumber maintenanceType')
      .populate('maintenanceWorkOrder', 'workOrderNumber status');
    if (!schedule) return notFound(res, 'Schedule not found');
    return success(res, schedule);
  } catch (e) { return serverError(res, e.message); }
};

exports.createSchedule = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('eam:maintenance_due', { scheduleId: schedule._id, scheduleNumber: schedule.scheduleNumber, scheduledDate: schedule.scheduledDate });
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'MaintenanceSchedule',
      entityId: schedule._id, entityLabel: schedule.scheduleNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, schedule, 'Schedule created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!schedule) return notFound(res, 'Schedule not found');
    return success(res, schedule, 'Schedule updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!schedule) return notFound(res, 'Schedule not found');
    return success(res, null, 'Schedule deleted');
  } catch (e) { return serverError(res, e.message); }
};

exports.completeSchedule = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOne({ _id: req.params.id, isDeleted: false });
    if (!schedule) return notFound(res, 'Schedule not found');
    if (schedule.status === 'completed') return error(res, 'Schedule already completed', 400);
    const updated = await MaintenanceSchedule.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedDate: new Date(), maintenanceWorkOrder: req.body.workOrderId },
      { new: true }
    );
    return success(res, updated, 'Schedule completed');
  } catch (e) { return serverError(res, e.message); }
};

exports.markScheduleOverdue = async (req, res) => {
  try {
    const now = new Date();
    const result = await MaintenanceSchedule.updateMany(
      { isDeleted: false, status: 'scheduled', dueDate: { $lt: now } },
      { status: 'overdue' }
    );
    const io = req.app.locals.io;
    if (io && result.modifiedCount > 0) {
      io.emit('eam:maintenance_overdue', { count: result.modifiedCount, checkedAt: now });
    }
    return success(res, { updated: result.modifiedCount }, `${result.modifiedCount} schedules marked overdue`);
  } catch (e) { return serverError(res, e.message); }
};

// ── Maintenance Contracts ─────────────────────────────────────────────────────

exports.getContracts = async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, status } = req.query;
    const filter = { isDeleted: false };
    if (vendor) filter.vendor = vendor;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenanceContract.find(filter)
        .populate('vendor', 'name')
        .sort({ endDate: 1 }).skip(skip).limit(Number(limit)),
      MaintenanceContract.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getContract = async (req, res) => {
  try {
    const contract = await MaintenanceContract.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name contactPerson email phone');
    if (!contract) return notFound(res, 'Contract not found');
    return success(res, contract);
  } catch (e) { return serverError(res, e.message); }
};

exports.createContract = async (req, res) => {
  try {
    const contract = await MaintenanceContract.create(req.body);
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'MaintenanceContract',
      entityId: contract._id, entityLabel: contract.contractNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, contract, 'Contract created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateContract = async (req, res) => {
  try {
    const contract = await MaintenanceContract.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!contract) return notFound(res, 'Contract not found');
    return success(res, contract, 'Contract updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteContract = async (req, res) => {
  try {
    const contract = await MaintenanceContract.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!contract) return notFound(res, 'Contract not found');
    return success(res, null, 'Contract deleted');
  } catch (e) { return serverError(res, e.message); }
};
