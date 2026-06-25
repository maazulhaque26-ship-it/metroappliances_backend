'use strict';
const MaintenancePlan      = require('../models/MaintenancePlan');
const MaintenanceTask      = require('../models/MaintenanceTask');
const MaintenanceChecklist = require('../models/MaintenanceChecklist');
const MaintenanceHistory   = require('../models/MaintenanceHistory');
const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const PredictiveMaintenance = require('../models/PredictiveMaintenance');
const MaintenancePlanner   = require('../models/MaintenancePlanner');
const MaintenanceLog       = require('../models/MaintenanceLog');
const VendorMaintenance    = require('../models/VendorMaintenance');
const AuditLog             = require('../models/AuditLog');
const { success, error, paginated, notFound, serverError } = require('../utils/response');

// ── Maintenance Plans ─────────────────────────────────────────────────────────

exports.getPlans = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, maintenanceType, status } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { planNumber: { $regex: search, $options: 'i' } },
    ];
    if (maintenanceType) filter.maintenanceType = maintenanceType;
    if (status) filter.isActive = status === 'active';
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenancePlan.find(filter).populate('asset', 'name assetNumber').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      MaintenancePlan.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getPlan = async (req, res) => {
  try {
    const plan = await MaintenancePlan.findOne({ _id: req.params.id, isDeleted: false })
      .populate('asset', 'name assetNumber assetType');
    if (!plan) return notFound(res, 'Maintenance plan not found');
    return success(res, plan);
  } catch (e) { return serverError(res, e.message); }
};

exports.createPlan = async (req, res) => {
  try {
    const plan = await MaintenancePlan.create(req.body);
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'MaintenancePlan',
      entityId: plan._id, entityLabel: plan.planNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, plan, 'Maintenance plan created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await MaintenancePlan.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!plan) return notFound(res, 'Maintenance plan not found');
    return success(res, plan, 'Plan updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await MaintenancePlan.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!plan) return notFound(res, 'Plan not found');
    return success(res, null, 'Plan deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Maintenance Tasks ─────────────────────────────────────────────────────────

exports.getTasks = async (req, res) => {
  try {
    const tasks = await MaintenanceTask.find({ maintenanceWorkOrder: req.params.workOrderId, isDeleted: false })
      .sort({ sequence: 1 });
    return success(res, tasks);
  } catch (e) { return serverError(res, e.message); }
};

exports.createTask = async (req, res) => {
  try {
    const task = await MaintenanceTask.create({ ...req.body, maintenanceWorkOrder: req.params.workOrderId });
    return success(res, task, 'Task created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await MaintenanceTask.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true }
    );
    if (!task) return notFound(res, 'Task not found');
    return success(res, task, 'Task updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await MaintenanceTask.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!task) return notFound(res, 'Task not found');
    return success(res, null, 'Task deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Maintenance Checklists ────────────────────────────────────────────────────

exports.getChecklists = async (req, res) => {
  try {
    const { page = 1, limit = 20, isTemplate } = req.query;
    const filter = { isDeleted: false };
    if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenanceChecklist.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      MaintenanceChecklist.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createChecklist = async (req, res) => {
  try {
    const checklist = await MaintenanceChecklist.create(req.body);
    return success(res, checklist, 'Checklist created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateChecklist = async (req, res) => {
  try {
    const checklist = await MaintenanceChecklist.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!checklist) return notFound(res, 'Checklist not found');
    return success(res, checklist, 'Checklist updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteChecklist = async (req, res) => {
  try {
    const cl = await MaintenanceChecklist.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!cl) return notFound(res, 'Checklist not found');
    return success(res, null, 'Checklist deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Maintenance History ───────────────────────────────────────────────────────

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (req.params.assetId) filter.asset = req.params.assetId;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenanceHistory.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ performedDate: -1 }).skip(skip).limit(Number(limit)),
      MaintenanceHistory.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createHistoryEntry = async (req, res) => {
  try {
    const entry = await MaintenanceHistory.create(req.body);
    return success(res, entry, 'History entry created', 201);
  } catch (e) { return serverError(res, e.message); }
};

// ── Preventive Maintenance ────────────────────────────────────────────────────

exports.getPreventive = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, assetId } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (assetId) filter.asset = assetId;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      PreventiveMaintenance.find(filter)
        .populate('asset', 'name assetNumber')
        .populate('maintenancePlan', 'name planNumber')
        .sort({ scheduledDate: 1 }).skip(skip).limit(Number(limit)),
      PreventiveMaintenance.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createPreventive = async (req, res) => {
  try {
    const pm = await PreventiveMaintenance.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('eam:maintenance_due', { pmId: pm._id, pmNumber: pm.pmNumber, scheduledDate: pm.scheduledDate });
    return success(res, pm, 'PM scheduled', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updatePreventive = async (req, res) => {
  try {
    const pm = await PreventiveMaintenance.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!pm) return notFound(res, 'PM record not found');
    return success(res, pm, 'PM updated');
  } catch (e) { return serverError(res, e.message); }
};

// ── Predictive Maintenance ────────────────────────────────────────────────────

exports.getPredictive = async (req, res) => {
  try {
    const { page = 1, limit = 20, trend, assetId } = req.query;
    const filter = { isDeleted: false };
    if (trend) filter.trend = trend;
    if (assetId) filter.asset = assetId;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      PredictiveMaintenance.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PredictiveMaintenance.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createPredictive = async (req, res) => {
  try {
    const pred = await PredictiveMaintenance.create(req.body);
    return success(res, pred, 'Predictive record created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updatePredictive = async (req, res) => {
  try {
    const pred = await PredictiveMaintenance.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!pred) return notFound(res, 'Predictive record not found');
    return success(res, pred, 'Predictive record updated');
  } catch (e) { return serverError(res, e.message); }
};

// ── Maintenance Planner ───────────────────────────────────────────────────────

exports.getPlanners = async (req, res) => {
  try {
    const { page = 1, limit = 20, plannerType, status } = req.query;
    const filter = { isDeleted: false };
    if (plannerType) filter.plannerType = plannerType;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenancePlanner.find(filter).sort({ startDate: -1 }).skip(skip).limit(Number(limit)),
      MaintenancePlanner.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getPlanner = async (req, res) => {
  try {
    const planner = await MaintenancePlanner.findOne({ _id: req.params.id, isDeleted: false });
    if (!planner) return notFound(res, 'Planner not found');
    return success(res, planner);
  } catch (e) { return serverError(res, e.message); }
};

exports.createPlanner = async (req, res) => {
  try {
    const planner = await MaintenancePlanner.create(req.body);
    return success(res, planner, 'Planner created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updatePlanner = async (req, res) => {
  try {
    const planner = await MaintenancePlanner.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!planner) return notFound(res, 'Planner not found');
    return success(res, planner, 'Planner updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deletePlanner = async (req, res) => {
  try {
    const planner = await MaintenancePlanner.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!planner) return notFound(res, 'Planner not found');
    return success(res, null, 'Planner deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Maintenance Log ───────────────────────────────────────────────────────────

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, assetId, logType } = req.query;
    const filter = { isDeleted: false };
    if (assetId) filter.asset = assetId;
    if (logType) filter.logType = logType;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenanceLog.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ maintenanceDate: -1 }).skip(skip).limit(Number(limit)),
      MaintenanceLog.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.create(req.body);
    return success(res, log, 'Log entry created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!log) return notFound(res, 'Log not found');
    return success(res, log, 'Log updated');
  } catch (e) { return serverError(res, e.message); }
};

// ── Vendor Maintenance ────────────────────────────────────────────────────────

exports.getVendorServices = async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, assetId, status } = req.query;
    const filter = { isDeleted: false };
    if (vendor) filter.vendor = vendor;
    if (assetId) filter.asset = assetId;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      VendorMaintenance.find(filter)
        .populate('vendor', 'name')
        .populate('asset', 'name assetNumber')
        .sort({ serviceDate: -1 }).skip(skip).limit(Number(limit)),
      VendorMaintenance.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createVendorService = async (req, res) => {
  try {
    const svc = await VendorMaintenance.create(req.body);
    return success(res, svc, 'Vendor service recorded', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateVendorService = async (req, res) => {
  try {
    const svc = await VendorMaintenance.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!svc) return notFound(res, 'Vendor service record not found');
    return success(res, svc, 'Vendor service updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteVendorService = async (req, res) => {
  try {
    const svc = await VendorMaintenance.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!svc) return notFound(res, 'Vendor service not found');
    return success(res, null, 'Vendor service deleted');
  } catch (e) { return serverError(res, e.message); }
};
