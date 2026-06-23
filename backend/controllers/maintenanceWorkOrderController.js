'use strict';
const MaintenanceWorkOrder = require('../models/MaintenanceWorkOrder');
const MaintenanceRequest   = require('../models/MaintenanceRequest');
const MaintenanceInventory = require('../models/MaintenanceInventory');
const AuditLog             = require('../models/AuditLog');
const { success, error, paginated, notFound, serverError } = require('../utils/response');

const TRANSITIONS = {
  draft:       ['planned','cancelled'],
  planned:     ['approved','cancelled'],
  approved:    ['assigned','cancelled'],
  assigned:    ['in_progress','cancelled'],
  in_progress: ['paused','completed','cancelled'],
  paused:      ['in_progress','cancelled'],
  completed:   ['verified','in_progress'],
  verified:    ['closed'],
  closed:      [],
  cancelled:   [],
};

// ── Work Order CRUD ───────────────────────────────────────────────────────────

exports.getWorkOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, priority, assetId } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { workOrderNumber: { $regex: search, $options: 'i' } },
    ];
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assetId) filter.asset = assetId;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenanceWorkOrder.find(filter)
        .populate('asset', 'name assetNumber')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      MaintenanceWorkOrder.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getWorkOrder = async (req, res) => {
  try {
    const wo = await MaintenanceWorkOrder.findOne({ _id: req.params.id, isDeleted: false })
      .populate('asset', 'name assetNumber assetType location')
      .populate('maintenancePlan', 'name planNumber')
      .populate('assignedTo', 'name email')
      .populate('approvedBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('closedBy', 'name');
    if (!wo) return notFound(res, 'Work order not found');
    const parts = await MaintenanceInventory.find({ maintenanceWorkOrder: wo._id, isDeleted: false });
    return success(res, { workOrder: wo, parts });
  } catch (e) { return serverError(res, e.message); }
};

exports.createWorkOrder = async (req, res) => {
  try {
    const wo = await MaintenanceWorkOrder.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('eam:workorder_created', { workOrderId: wo._id, workOrderNumber: wo.workOrderNumber, title: wo.title, priority: wo.priority });
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'MaintenanceWorkOrder',
      entityId: wo._id, entityLabel: wo.workOrderNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, wo, 'Work order created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateWorkOrder = async (req, res) => {
  try {
    const before = await MaintenanceWorkOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return notFound(res, 'Work order not found');
    const wo = await MaintenanceWorkOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'UPDATE', entity: 'MaintenanceWorkOrder',
      entityId: wo._id, entityLabel: wo.workOrderNumber,
      changes: { before, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, wo, 'Work order updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteWorkOrder = async (req, res) => {
  try {
    const wo = await MaintenanceWorkOrder.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!wo) return notFound(res, 'Work order not found');
    return success(res, null, 'Work order deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Status Transitions ────────────────────────────────────────────────────────

exports.transitionWorkOrder = async (req, res) => {
  try {
    const { newStatus } = req.body;
    const wo = await MaintenanceWorkOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!wo) return notFound(res, 'Work order not found');
    const allowed = TRANSITIONS[wo.status] || [];
    if (!allowed.includes(newStatus)) {
      return error(res, `Cannot transition from '${wo.status}' to '${newStatus}'`, 400);
    }
    const update = { status: newStatus };
    if (newStatus === 'in_progress' && !wo.actualStartDate) update.actualStartDate = new Date();
    if (newStatus === 'completed') update.actualEndDate = new Date();
    if (newStatus === 'verified') update.verifiedBy = req.user._id;
    if (newStatus === 'closed') { update.closedBy = req.user._id; update.closedDate = new Date(); }
    const updated = await MaintenanceWorkOrder.findByIdAndUpdate(req.params.id, update, { new: true });
    const io = req.app.locals.io;
    if (io && newStatus === 'completed') {
      io.emit('eam:workorder_completed', { workOrderId: updated._id, workOrderNumber: updated.workOrderNumber });
    }
    if (io && newStatus === 'in_progress' && updated.priority === 'emergency') {
      io.emit('eam:breakdown', { workOrderId: updated._id, assetId: updated.asset, severity: 'emergency' });
    }
    return success(res, updated, `Work order ${newStatus}`);
  } catch (e) { return serverError(res, e.message); }
};

// ── Work Order Parts ──────────────────────────────────────────────────────────

exports.getWorkOrderParts = async (req, res) => {
  try {
    const parts = await MaintenanceInventory.find({ maintenanceWorkOrder: req.params.id, isDeleted: false });
    return success(res, parts);
  } catch (e) { return serverError(res, e.message); }
};

exports.addWorkOrderPart = async (req, res) => {
  try {
    const part = await MaintenanceInventory.create({ ...req.body, maintenanceWorkOrder: req.params.id });
    return success(res, part, 'Part issued', 201);
  } catch (e) { return serverError(res, e.message); }
};

// ── Maintenance Requests ──────────────────────────────────────────────────────

exports.getRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, assetId } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (assetId) filter.asset = assetId;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .populate('asset', 'name assetNumber')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      MaintenanceRequest.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getRequest = async (req, res) => {
  try {
    const req_ = await MaintenanceRequest.findOne({ _id: req.params.id, isDeleted: false })
      .populate('asset', 'name assetNumber');
    if (!req_) return notFound(res, 'Request not found');
    return success(res, req_);
  } catch (e) { return serverError(res, e.message); }
};

exports.createRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.create(req.body);
    return success(res, request, 'Maintenance request created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!request) return notFound(res, 'Request not found');
    return success(res, request, 'Request updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.convertRequestToWorkOrder = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findOne({ _id: req.params.id, isDeleted: false });
    if (!request) return notFound(res, 'Request not found');
    if (!['approved'].includes(request.status)) {
      return error(res, 'Only approved requests can be converted to work orders', 400);
    }
    const wo = await MaintenanceWorkOrder.create({
      title: request.title,
      asset: request.asset,
      maintenanceType: 'corrective',
      description: request.description,
      priority: request.priority || 'medium',
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByName,
      maintenanceRequest: request._id,
    });
    await MaintenanceRequest.findByIdAndUpdate(request._id, { status: 'converted', convertedToWorkOrder: wo._id });
    const io = req.app.locals.io;
    if (io) io.emit('eam:workorder_created', { workOrderId: wo._id, workOrderNumber: wo.workOrderNumber, title: wo.title });
    return success(res, wo, 'Request converted to work order', 201);
  } catch (e) { return serverError(res, e.message); }
};
