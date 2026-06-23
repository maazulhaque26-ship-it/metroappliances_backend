'use strict';
const WorkOrder          = require('../models/WorkOrder');
const WorkOrderOperation = require('../models/WorkOrderOperation');
const ProductionEvent    = require('../models/ProductionEvent');
const AuditLog           = require('../models/AuditLog');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── CRUD ────────────────────────────────────────────────────────────────────
exports.createWorkOrder = async (req, res) => {
  try {
    const { factory, plannedQty } = req.body;
    if (!factory || !plannedQty) return fail(res, 'factory and plannedQty are required');
    const doc = await WorkOrder.create({ ...req.body, factory });
    await ProductionEvent.create({ eventType: 'work_order_created', workOrder: doc._id, factory: doc.factory, message: `Work order ${doc.orderNumber} created`, severity: 'info', metadata: { orderNumber: doc.orderNumber } });
    await AuditLog.create({ admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '', adminRole: req.user?.role || 'admin', action: 'create', entity: 'WorkOrder', entityId: doc._id, entityLabel: doc.orderNumber, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('mes:workorder_created', { id: doc._id, orderNumber: doc.orderNumber });
    return created(res, doc, 'Work order created');
  } catch (err) { return serverError(res, err); }
};

exports.getWorkOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, factory, priority, search } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status   = status;
    if (factory)  filter.factory  = factory;
    if (priority) filter.priority = priority;
    if (search)   filter.orderNumber = { $regex: search, $options: 'i' };
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await WorkOrder.countDocuments(filter);
    const data  = await WorkOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('factory', 'name').populate('workCenter', 'name').populate('shift', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getWorkOrder = async (req, res) => {
  try {
    const doc = await WorkOrder.findOne({ _id: req.params.id, isDeleted: false })
      .populate('factory', 'name').populate('workCenter', 'name').populate('shift', 'name')
      .populate('productionOrder', 'orderNumber').populate('product', 'name sku');
    if (!doc) return notFound(res, 'Work order');
    const operations = await WorkOrderOperation.find({ workOrder: doc._id, isDeleted: false }).sort({ sequence: 1 });
    return ok(res, { ...doc.toObject({ virtuals: true }), operations });
  } catch (err) { return serverError(res, err); }
};

exports.updateWorkOrder = async (req, res) => {
  try {
    const doc = await WorkOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Work order');
    if (['completed','cancelled'].includes(doc.status)) return fail(res, `Cannot edit a ${doc.status} work order`);
    const before = doc.toObject();
    const allowed = ['productName','productSKU','workCenter','shift','plannedQty','unit','priority','plannedStartDate','plannedEndDate','estimatedDurationMins','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    await AuditLog.create({ admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '', adminRole: req.user?.role || 'admin', action: 'update', entity: 'WorkOrder', entityId: doc._id, entityLabel: doc.orderNumber, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc, 'Work order updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteWorkOrder = async (req, res) => {
  try {
    const doc = await WorkOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Work order');
    if (!['draft','cancelled'].includes(doc.status)) return fail(res, 'Only draft or cancelled work orders can be deleted');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ─── Status transitions ──────────────────────────────────────────────────────
const transition = (from, to, eventType, ioEvent) => async (req, res) => {
  try {
    const doc = await WorkOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Work order');
    if (!from.includes(doc.status)) return fail(res, `Cannot ${to} a ${doc.status} work order`);
    const before = doc.toObject();
    doc.status = to;
    if (to === 'started' && !doc.actualStartDate) doc.actualStartDate = new Date();
    if (to === 'completed') {
      doc.actualEndDate = new Date();
      if (doc.actualStartDate) doc.actualDurationMins = Math.round((Date.now() - doc.actualStartDate.getTime()) / 60000);
      doc.completedBy     = req.user?._id;
      doc.completedByName = req.user?.name || '';
    }
    if (to === 'released') { doc.releasedBy = req.user?._id; doc.releasedByName = req.user?.name || ''; }
    await doc.save();
    await ProductionEvent.create({ eventType, workOrder: doc._id, factory: doc.factory, message: `Work order ${doc.orderNumber} ${to}`, severity: 'info', metadata: { status: to } });
    const io = req.app.locals.io;
    if (io) io.emit(ioEvent, { id: doc._id, orderNumber: doc.orderNumber, status: to });
    return ok(res, doc, `Work order ${to}`);
  } catch (err) { return serverError(res, err); }
};

exports.releaseWorkOrder   = transition(['draft'],                          'released',  'work_order_released',  'mes:workorder_released');
exports.startWorkOrder     = transition(['released','paused'],              'started',   'work_order_started',   'mes:started');
exports.pauseWorkOrder     = transition(['started'],                        'paused',    'work_order_paused',    'mes:paused');
exports.completeWorkOrder  = transition(['started','paused'],               'completed', 'work_order_completed', 'mes:completed');
exports.cancelWorkOrder    = transition(['draft','released','paused'],      'cancelled', 'work_order_cancelled', 'mes:workorder_cancelled');

// ─── Operations ──────────────────────────────────────────────────────────────
exports.createOperation = async (req, res) => {
  try {
    const wo = await WorkOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!wo) return notFound(res, 'Work order');
    const op = await WorkOrderOperation.create({ ...req.body, workOrder: wo._id });
    return created(res, op, 'Operation added');
  } catch (err) { return serverError(res, err); }
};

exports.updateOperation = async (req, res) => {
  try {
    const op = await WorkOrderOperation.findOne({ _id: req.params.opId, workOrder: req.params.id, isDeleted: false });
    if (!op) return notFound(res, 'Operation');
    const allowed = ['operationName','operationType','workCenter','machine','shift','operator','operatorName','estimatedDurationMins','setupTimeMins','plannedQty','instructions','notes','sequence'];
    for (const k of allowed) if (req.body[k] !== undefined) op[k] = req.body[k];
    await op.save();
    return ok(res, op, 'Operation updated');
  } catch (err) { return serverError(res, err); }
};

exports.completeOperation = async (req, res) => {
  try {
    const op = await WorkOrderOperation.findOne({ _id: req.params.opId, workOrder: req.params.id, isDeleted: false });
    if (!op) return notFound(res, 'Operation');
    if (op.status === 'completed') return fail(res, 'Operation is already completed');
    op.status      = 'completed';
    op.completedAt = new Date();
    if (req.body.completedQty !== undefined) op.completedQty = req.body.completedQty;
    if (req.body.scrapQty     !== undefined) op.scrapQty     = req.body.scrapQty;
    if (req.body.actualDurationMins !== undefined) op.actualDurationMins = req.body.actualDurationMins;
    await op.save();
    await ProductionEvent.create({ eventType: 'operation_completed', workOrder: op.workOrder, message: `Operation ${op.operationName} completed`, severity: 'info', metadata: { operationId: op._id } });
    return ok(res, op, 'Operation completed');
  } catch (err) { return serverError(res, err); }
};
