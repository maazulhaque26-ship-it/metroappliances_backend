'use strict';
const MachineDowntime    = require('../models/MachineDowntime');
const DowntimeReason     = require('../models/DowntimeReason');
const MaintenanceTrigger = require('../models/MaintenanceTrigger');
const ProductionEvent    = require('../models/ProductionEvent');
const AuditLog           = require('../models/AuditLog');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── Machine downtime ────────────────────────────────────────────────────────
exports.createDowntime = async (req, res) => {
  try {
    const { machine, reason, startTime } = req.body;
    if (!machine || !reason) return fail(res, 'machine and reason are required');
    const doc = await MachineDowntime.create({ ...req.body, startTime: startTime ? new Date(startTime) : new Date(), status: 'open' });
    await ProductionEvent.create({ eventType: 'downtime_started', machine: doc.machine, factory: doc.factory, workOrder: doc.workOrder, message: `Downtime ${doc.downtimeNumber} started: ${doc.reason}`, severity: doc.category === 'unplanned' ? 'critical' : 'warning', metadata: { downtimeId: doc._id, reason: doc.reason, category: doc.category } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:downtime', { id: doc._id, machineId: machine, reason: doc.reason, category: doc.category });
    return created(res, doc, 'Downtime event created');
  } catch (err) { return serverError(res, err); }
};

exports.getDowntimes = async (req, res) => {
  try {
    const { page = 1, limit = 20, machine, factory, status, category, reason, dateFrom, dateTo } = req.query;
    const filter = { isDeleted: false };
    if (machine)  filter.machine  = machine;
    if (factory)  filter.factory  = factory;
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (reason)   filter.reason   = reason;
    if (dateFrom || dateTo) {
      filter.startTime = {};
      if (dateFrom) filter.startTime.$gte = new Date(dateFrom);
      if (dateTo)   filter.startTime.$lte = new Date(dateTo);
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MachineDowntime.countDocuments(filter);
    const data  = await MachineDowntime.find(filter).sort({ startTime: -1 }).skip(skip).limit(Number(limit))
      .populate('machine', 'name code').populate('factory', 'name').populate('workOrder', 'orderNumber');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getDowntime = async (req, res) => {
  try {
    const doc = await MachineDowntime.findOne({ _id: req.params.id, isDeleted: false })
      .populate('machine', 'name code').populate('factory', 'name').populate('workOrder', 'orderNumber');
    if (!doc) return notFound(res, 'Downtime');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.resolveDowntime = async (req, res) => {
  try {
    const doc = await MachineDowntime.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Downtime');
    if (doc.status === 'resolved') return fail(res, 'Downtime is already resolved');
    doc.endTime       = req.body.endTime ? new Date(req.body.endTime) : new Date();
    doc.durationMins  = Math.round((doc.endTime.getTime() - doc.startTime.getTime()) / 60000);
    doc.status        = 'resolved';
    doc.resolution    = req.body.resolution || '';
    doc.resolvedBy    = req.user?._id;
    doc.resolvedByName = req.user?.name || '';
    if (req.body.rootCause) doc.rootCause = req.body.rootCause;
    if (req.body.correctiveAction) doc.correctiveAction = req.body.correctiveAction;
    await doc.save();
    await ProductionEvent.create({ eventType: 'downtime_ended', machine: doc.machine, factory: doc.factory, workOrder: doc.workOrder, message: `Downtime ${doc.downtimeNumber} resolved after ${doc.durationMins} mins`, severity: 'info', metadata: { downtimeId: doc._id, durationMins: doc.durationMins } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:machine_status', { machineId: doc.machine, status: 'available' });
    return ok(res, doc, 'Downtime resolved');
  } catch (err) { return serverError(res, err); }
};

exports.deleteDowntime = async (req, res) => {
  try {
    const doc = await MachineDowntime.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Downtime');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ─── Downtime reasons (catalog) ───────────────────────────────────────────────
exports.createDowntimeReason = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) return fail(res, 'name and category are required');
    const doc = await DowntimeReason.create(req.body);
    return created(res, doc, 'Downtime reason created');
  } catch (err) { return serverError(res, err); }
};

exports.getDowntimeReasons = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = { isDeleted: false };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const data = await DowntimeReason.find(filter).sort({ category: 1, name: 1 });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.updateDowntimeReason = async (req, res) => {
  try {
    const doc = await DowntimeReason.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Downtime reason');
    const allowed = ['name','category','description','isMaintenance','isPlanned','avgResolutionMins','isActive'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Downtime reason updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteDowntimeReason = async (req, res) => {
  try {
    const doc = await DowntimeReason.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Downtime reason');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ─── Maintenance triggers ─────────────────────────────────────────────────────
exports.createMaintenanceTrigger = async (req, res) => {
  try {
    const { machine, triggerType, triggerName } = req.body;
    if (!machine || !triggerType || !triggerName) return fail(res, 'machine, triggerType and triggerName are required');
    const doc = await MaintenanceTrigger.create(req.body);
    return created(res, doc, 'Maintenance trigger created');
  } catch (err) { return serverError(res, err); }
};

exports.getMaintenanceTriggers = async (req, res) => {
  try {
    const { page = 1, limit = 20, machine, status, priority } = req.query;
    const filter = { isDeleted: false };
    if (machine)  filter.machine  = machine;
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MaintenanceTrigger.countDocuments(filter);
    const data  = await MaintenanceTrigger.find(filter).sort({ priority: -1, nextTriggerAt: 1 }).skip(skip).limit(Number(limit))
      .populate('machine', 'name code');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getMaintenanceTrigger = async (req, res) => {
  try {
    const doc = await MaintenanceTrigger.findOne({ _id: req.params.id, isDeleted: false }).populate('machine', 'name code');
    if (!doc) return notFound(res, 'Maintenance trigger');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateMaintenanceTrigger = async (req, res) => {
  try {
    const doc = await MaintenanceTrigger.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Maintenance trigger');
    const allowed = ['triggerName','description','conditionValue','unit','thresholdValue','isActive','nextTriggerAt','assignedTo','assignedToName','priority','status','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Maintenance trigger updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteMaintenanceTrigger = async (req, res) => {
  try {
    const doc = await MaintenanceTrigger.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Maintenance trigger');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};
