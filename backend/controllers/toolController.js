'use strict';
const ToolManagement  = require('../models/ToolManagement');
const ToolUsage       = require('../models/ToolUsage');
const ToolCalibration = require('../models/ToolCalibration');
const ProductionEvent = require('../models/ProductionEvent');
const AuditLog        = require('../models/AuditLog');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── Tool management ──────────────────────────────────────────────────────────
exports.createTool = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return fail(res, 'name and type are required');
    const doc = await ToolManagement.create(req.body);
    await AuditLog.create({ admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '', adminRole: req.user?.role || 'admin', action: 'create', entity: 'ToolManagement', entityId: doc._id, entityLabel: doc.toolCode, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return created(res, doc, 'Tool created');
  } catch (err) { return serverError(res, err); }
};

exports.getTools = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, factory, workCenter, search } = req.query;
    const filter = { isDeleted: false };
    if (type)       filter.type       = type;
    if (status)     filter.status     = status;
    if (factory)    filter.factory    = factory;
    if (workCenter) filter.workCenter = workCenter;
    if (search)     filter.$or = [{ toolCode: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }];
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ToolManagement.countDocuments(filter);
    const data  = await ToolManagement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('factory', 'name').populate('workCenter', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getTool = async (req, res) => {
  try {
    const doc = await ToolManagement.findOne({ _id: req.params.id, isDeleted: false })
      .populate('factory', 'name').populate('workCenter', 'name');
    if (!doc) return notFound(res, 'Tool');
    const [latestCalibration, activeUsage] = await Promise.all([
      ToolCalibration.findOne({ tool: doc._id }).sort({ calibrationDate: -1 }),
      ToolUsage.findOne({ tool: doc._id, endTime: null, isDeleted: false }),
    ]);
    return ok(res, { ...doc.toObject(), latestCalibration, activeUsage });
  } catch (err) { return serverError(res, err); }
};

exports.updateTool = async (req, res) => {
  try {
    const doc = await ToolManagement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Tool');
    const before = doc.toObject();
    const allowed = ['name','description','type','status','location','factory','workCenter','manufacturer','modelNumber','serialNumber','purchaseDate','maxUsageCycles','currentUsageCycles','calibrationFrequencyDays','nextCalibrationDate','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    await AuditLog.create({ admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '', adminRole: req.user?.role || 'admin', action: 'update', entity: 'ToolManagement', entityId: doc._id, entityLabel: doc.toolCode, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok(res, doc, 'Tool updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteTool = async (req, res) => {
  try {
    const doc = await ToolManagement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Tool');
    if (doc.status === 'in_use') return fail(res, 'Cannot delete a tool that is currently in use');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ─── Tool usage ───────────────────────────────────────────────────────────────
exports.startToolUsage = async (req, res) => {
  try {
    const { tool, workOrder, operator, operatorName } = req.body;
    if (!tool) return fail(res, 'tool is required');
    const toolDoc = await ToolManagement.findOne({ _id: tool, isDeleted: false });
    if (!toolDoc) return notFound(res, 'Tool');
    if (toolDoc.status === 'in_use') return fail(res, 'Tool is already in use');
    const usage = await ToolUsage.create({ tool, workOrder, operator, operatorName, startTime: new Date() });
    toolDoc.status = 'in_use';
    await toolDoc.save();
    await ProductionEvent.create({ eventType: 'tool_change', workOrder, factory: null, message: `Tool ${toolDoc.toolCode} checked out`, severity: 'info', metadata: { toolId: tool, usageId: usage._id } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:tool_change', { toolId: tool, status: 'in_use', usageId: usage._id });
    return created(res, usage, 'Tool usage started');
  } catch (err) { return serverError(res, err); }
};

exports.endToolUsage = async (req, res) => {
  try {
    const usage = await ToolUsage.findOne({ _id: req.params.id, isDeleted: false });
    if (!usage) return notFound(res, 'Tool usage');
    if (usage.endTime) return fail(res, 'Tool usage already ended');
    usage.endTime      = new Date();
    usage.durationMins = Math.round((usage.endTime.getTime() - usage.startTime.getTime()) / 60000);
    if (req.body.cyclesUsed !== undefined) usage.cyclesUsed = req.body.cyclesUsed;
    if (req.body.notes !== undefined) usage.notes = req.body.notes;
    await usage.save();
    const toolDoc = await ToolManagement.findById(usage.tool);
    if (toolDoc) {
      toolDoc.status = 'available';
      toolDoc.currentUsageCycles += usage.cyclesUsed || 1;
      await toolDoc.save();
    }
    await ProductionEvent.create({ eventType: 'tool_change', workOrder: usage.workOrder, factory: null, message: `Tool checked in after ${usage.durationMins} mins`, severity: 'info', metadata: { toolId: usage.tool, usageId: usage._id } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:tool_change', { toolId: usage.tool, status: 'available' });
    return ok(res, usage, 'Tool usage ended');
  } catch (err) { return serverError(res, err); }
};

exports.getToolUsages = async (req, res) => {
  try {
    const { page = 1, limit = 20, tool, workOrder, active } = req.query;
    const filter = { isDeleted: false };
    if (tool)      filter.tool      = tool;
    if (workOrder) filter.workOrder = workOrder;
    if (active === 'true') filter.endTime = null;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ToolUsage.countDocuments(filter);
    const data  = await ToolUsage.find(filter).sort({ startTime: -1 }).skip(skip).limit(Number(limit))
      .populate('tool', 'toolCode name').populate('workOrder', 'orderNumber');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ─── Tool calibration ─────────────────────────────────────────────────────────
exports.createCalibration = async (req, res) => {
  try {
    const { tool, calibrationDate, nextCalibrationDate, result } = req.body;
    if (!tool || !calibrationDate || !nextCalibrationDate || !result) {
      return fail(res, 'tool, calibrationDate, nextCalibrationDate and result are required');
    }
    const toolDoc = await ToolManagement.findOne({ _id: tool, isDeleted: false });
    if (!toolDoc) return notFound(res, 'Tool');
    const doc = await ToolCalibration.create(req.body);
    toolDoc.lastCalibrationDate = new Date(calibrationDate);
    toolDoc.nextCalibrationDate = new Date(nextCalibrationDate);
    if (doc.result === 'pass' || doc.result === 'conditional') toolDoc.status = 'available';
    else if (doc.result === 'fail') toolDoc.status = 'maintenance';
    await toolDoc.save();
    return created(res, doc, 'Calibration recorded');
  } catch (err) { return serverError(res, err); }
};

exports.getCalibrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, tool, result } = req.query;
    const filter = { isDeleted: false };
    if (tool)   filter.tool   = tool;
    if (result) filter.result = result;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ToolCalibration.countDocuments(filter);
    const data  = await ToolCalibration.find(filter).sort({ calibrationDate: -1 }).skip(skip).limit(Number(limit))
      .populate('tool', 'toolCode name').populate('performedBy', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};
