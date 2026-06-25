'use strict';
const ProductionExecution = require('../models/ProductionExecution');
const OperationExecution  = require('../models/OperationExecution');
const WorkOrder           = require('../models/WorkOrder');
const MachineRuntime      = require('../models/MachineRuntime');
const ProductionEvent     = require('../models/ProductionEvent');
const AuditLog            = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

exports.startExecution = async (req, res) => {
  try {
    const { workOrder, factory, shift, workCenter, machine, operator, operatorName, targetQty } = req.body;
    if (!workOrder || !factory) return fail(res, 'workOrder and factory are required');
    const wo = await WorkOrder.findOne({ _id: workOrder, isDeleted: false });
    if (!wo) return notFound(res, 'Work order');
    if (!['released','started','paused'].includes(wo.status)) return fail(res, 'Work order is not in a releaseable state');
    const exec = await ProductionExecution.create({ workOrder, factory, shift, workCenter, machine, operator, operatorName, targetQty, startTime: new Date(), status: 'active' });
    if (wo.status !== 'started') { wo.status = 'started'; if (!wo.actualStartDate) wo.actualStartDate = new Date(); await wo.save(); }
    await ProductionEvent.create({ eventType: 'work_order_started', workOrder, factory, message: `Production execution ${exec.executionNumber} started`, severity: 'info', metadata: { executionId: exec._id } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:started', { executionId: exec._id, workOrderId: workOrder });
    return created(res, exec, 'Production execution started');
  } catch (err) { return serverError(res, err); }
};

exports.updateExecution = async (req, res) => {
  try {
    const exec = await ProductionExecution.findOne({ _id: req.params.id, isDeleted: false });
    if (!exec) return notFound(res, 'Production execution');
    const allowed = ['actualQty','scrapQty','reworkQty','setupTimeMins','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) exec[k] = req.body[k];
    await exec.save();
    return ok(res, exec, 'Execution updated');
  } catch (err) { return serverError(res, err); }
};

exports.pauseExecution = async (req, res) => {
  try {
    const exec = await ProductionExecution.findOne({ _id: req.params.id, isDeleted: false });
    if (!exec) return notFound(res, 'Production execution');
    if (exec.status !== 'active') return fail(res, 'Execution is not active');
    exec.status = 'paused';
    exec.pauseReason = req.body.pauseReason || '';
    await exec.save();
    const io = req.app.locals.io;
    if (io) io.emit('mes:paused', { executionId: exec._id });
    return ok(res, exec, 'Execution paused');
  } catch (err) { return serverError(res, err); }
};

exports.completeExecution = async (req, res) => {
  try {
    const exec = await ProductionExecution.findOne({ _id: req.params.id, isDeleted: false });
    if (!exec) return notFound(res, 'Production execution');
    if (['completed','cancelled'].includes(exec.status)) return fail(res, `Execution is already ${exec.status}`);
    exec.status    = 'completed';
    exec.endTime   = new Date();
    exec.durationMins = Math.round((exec.endTime.getTime() - exec.startTime.getTime()) / 60000);
    if (req.body.actualQty !== undefined) exec.actualQty = req.body.actualQty;
    if (req.body.scrapQty  !== undefined) exec.scrapQty  = req.body.scrapQty;
    await exec.save();
    // Update work order completion qty
    const wo = await WorkOrder.findById(exec.workOrder);
    if (wo) { wo.completedQty += exec.actualQty; wo.scrapQty += exec.scrapQty; await wo.save(); }
    // Create machine runtime record
    if (exec.machine) {
      await MachineRuntime.create({ machine: exec.machine, workOrder: exec.workOrder, shift: exec.shift, factory: exec.factory, date: exec.startTime, runtimeMins: exec.durationMins - (exec.setupTimeMins || 0), setupTimeMins: exec.setupTimeMins || 0, throughput: exec.actualQty });
    }
    await ProductionEvent.create({ eventType: 'work_order_completed', workOrder: exec.workOrder, factory: exec.factory, message: `Production execution ${exec.executionNumber} completed`, severity: 'info', metadata: { actualQty: exec.actualQty } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:completed', { executionId: exec._id, actualQty: exec.actualQty });
    return ok(res, exec, 'Execution completed');
  } catch (err) { return serverError(res, err); }
};

exports.getExecutions = async (req, res) => {
  try {
    const { page = 1, limit = 20, workOrder, factory, status } = req.query;
    const filter = { isDeleted: false };
    if (workOrder) filter.workOrder = workOrder;
    if (factory)   filter.factory   = factory;
    if (status)    filter.status    = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ProductionExecution.countDocuments(filter);
    const data  = await ProductionExecution.find(filter).sort({ startTime: -1 }).skip(skip).limit(Number(limit))
      .populate('workOrder', 'orderNumber productName').populate('machine', 'name').populate('factory', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getExecution = async (req, res) => {
  try {
    const doc = await ProductionExecution.findOne({ _id: req.params.id, isDeleted: false })
      .populate('workOrder', 'orderNumber productName plannedQty').populate('machine', 'name')
      .populate('factory', 'name').populate('workCenter', 'name').populate('shift', 'name');
    if (!doc) return notFound(res, 'Production execution');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.recordOperationExecution = async (req, res) => {
  try {
    const { workOrder, workOrderOperation, operator, operatorName, machine, workCenter, startTime, quantityProduced } = req.body;
    if (!workOrder || !startTime) return fail(res, 'workOrder and startTime are required');
    const exec = await OperationExecution.create({ workOrder, workOrderOperation, operator, operatorName, machine, workCenter, startTime: new Date(startTime), quantityProduced: quantityProduced || 0 });
    return created(res, exec, 'Operation execution recorded');
  } catch (err) { return serverError(res, err); }
};

exports.getOperationExecutions = async (req, res) => {
  try {
    const { page = 1, limit = 20, workOrder, machine } = req.query;
    const filter = { isDeleted: false };
    if (workOrder) filter.workOrder = workOrder;
    if (machine)   filter.machine   = machine;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await OperationExecution.countDocuments(filter);
    const data  = await OperationExecution.find(filter).sort({ startTime: -1 }).skip(skip).limit(Number(limit))
      .populate('machine', 'name').populate('workOrder', 'orderNumber');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};
