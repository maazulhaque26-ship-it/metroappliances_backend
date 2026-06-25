'use strict';
const QualityInspection = require('../models/QualityInspection');
const QualityCheckpoint = require('../models/QualityCheckpoint');
const QualityDefect     = require('../models/QualityDefect');
const ProductionScrap   = require('../models/ProductionScrap');
const ProductionRework  = require('../models/ProductionRework');
const ProductionEvent   = require('../models/ProductionEvent');
const AuditLog          = require('../models/AuditLog');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── Inspections ─────────────────────────────────────────────────────────────
exports.createInspection = async (req, res) => {
  try {
    const { workOrder, inspectionType, inspectedQty } = req.body;
    if (!workOrder || !inspectionType || inspectedQty == null) return fail(res, 'workOrder, inspectionType and inspectedQty are required');
    const doc = await QualityInspection.create(req.body);
    await ProductionEvent.create({ eventType: doc.result === 'fail' ? 'inspection_failed' : 'inspection_passed', workOrder: doc.workOrder, factory: doc.factory, message: `${inspectionType} inspection ${doc.inspectionNumber}: ${doc.result}`, severity: doc.result === 'fail' ? 'warning' : 'info', metadata: { inspectionId: doc._id, result: doc.result } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:inspection', { id: doc._id, result: doc.result, workOrder: doc.workOrder });
    return created(res, doc, 'Inspection created');
  } catch (err) { return serverError(res, err); }
};

exports.getInspections = async (req, res) => {
  try {
    const { page = 1, limit = 20, workOrder, factory, result, inspectionType } = req.query;
    const filter = { isDeleted: false };
    if (workOrder)      filter.workOrder      = workOrder;
    if (factory)        filter.factory        = factory;
    if (result)         filter.result         = result;
    if (inspectionType) filter.inspectionType = inspectionType;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await QualityInspection.countDocuments(filter);
    const data  = await QualityInspection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('workOrder', 'orderNumber productName').populate('inspectedBy', 'name');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getInspection = async (req, res) => {
  try {
    const doc = await QualityInspection.findOne({ _id: req.params.id, isDeleted: false })
      .populate('workOrder', 'orderNumber productName').populate('inspectedBy', 'name');
    if (!doc) return notFound(res, 'Inspection');
    const checkpoints = await QualityCheckpoint.find({ workOrder: doc.workOrder, isDeleted: false }).sort({ sequence: 1 });
    return ok(res, { ...doc.toObject(), checkpoints });
  } catch (err) { return serverError(res, err); }
};

exports.updateInspection = async (req, res) => {
  try {
    const doc = await QualityInspection.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Inspection');
    const allowed = ['result','passQty','failQty','notes','correctiveAction','inspectedBy','inspectedByName'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Inspection updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteInspection = async (req, res) => {
  try {
    const doc = await QualityInspection.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Inspection');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ─── Checkpoints ─────────────────────────────────────────────────────────────
exports.createCheckpoint = async (req, res) => {
  try {
    const { workOrder, name } = req.body;
    if (!workOrder || !name) return fail(res, 'workOrder and name are required');
    const doc = await QualityCheckpoint.create(req.body);
    return created(res, doc, 'Checkpoint created');
  } catch (err) { return serverError(res, err); }
};

exports.getCheckpoints = async (req, res) => {
  try {
    const { page = 1, limit = 50, workOrder } = req.query;
    const filter = { isDeleted: false };
    if (workOrder) filter.workOrder = workOrder;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await QualityCheckpoint.countDocuments(filter);
    const data  = await QualityCheckpoint.find(filter).sort({ sequence: 1 }).skip(skip).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.updateCheckpoint = async (req, res) => {
  try {
    const doc = await QualityCheckpoint.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Checkpoint');
    const allowed = ['result','actualValue','notes','checkedBy','checkedByName','checkedAt'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Checkpoint updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteCheckpoint = async (req, res) => {
  try {
    const doc = await QualityCheckpoint.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Checkpoint');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};

// ─── Defects ─────────────────────────────────────────────────────────────────
exports.createDefect = async (req, res) => {
  try {
    const { workOrder, defectName } = req.body;
    if (!workOrder || !defectName) return fail(res, 'workOrder and defectName are required');
    const doc = await QualityDefect.create(req.body);
    await ProductionEvent.create({ eventType: 'defect_recorded', workOrder: doc.workOrder, factory: doc.factory, message: `Defect ${doc.defectNumber} recorded: ${doc.defectName}`, severity: doc.severity === 'critical' ? 'critical' : 'warning', metadata: { defectId: doc._id, severity: doc.severity } });
    const io = req.app.locals.io;
    if (io) io.emit('mes:defect', { id: doc._id, severity: doc.severity, workOrder: doc.workOrder });
    return created(res, doc, 'Defect recorded');
  } catch (err) { return serverError(res, err); }
};

exports.getDefects = async (req, res) => {
  try {
    const { page = 1, limit = 20, workOrder, severity, disposition, defectCategory } = req.query;
    const filter = { isDeleted: false };
    if (workOrder)      filter.workOrder      = workOrder;
    if (severity)       filter.severity       = severity;
    if (disposition)    filter.disposition    = disposition;
    if (defectCategory) filter.defectCategory = defectCategory;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await QualityDefect.countDocuments(filter);
    const data  = await QualityDefect.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('workOrder', 'orderNumber productName');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getDefect = async (req, res) => {
  try {
    const doc = await QualityDefect.findOne({ _id: req.params.id, isDeleted: false }).populate('workOrder', 'orderNumber productName');
    if (!doc) return notFound(res, 'Defect');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.updateDefect = async (req, res) => {
  try {
    const doc = await QualityDefect.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Defect');
    const allowed = ['disposition','rootCause','correctiveAction','capaRequired','capaDescription','resolvedAt','resolvedBy','resolvedByName','notes'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Defect updated');
  } catch (err) { return serverError(res, err); }
};

// ─── Scrap ───────────────────────────────────────────────────────────────────
exports.createScrap = async (req, res) => {
  try {
    const { workOrder, reason } = req.body;
    if (!workOrder || !reason) return fail(res, 'workOrder and reason are required');
    const doc = await ProductionScrap.create(req.body);
    await ProductionEvent.create({ eventType: 'scrap_reported', workOrder: doc.workOrder, factory: doc.factory, message: `Scrap ${doc.scrapNumber} reported: ${doc.qty} ${doc.unit}`, severity: 'warning', metadata: { scrapId: doc._id, qty: doc.qty } });
    return created(res, doc, 'Scrap recorded');
  } catch (err) { return serverError(res, err); }
};

exports.getScrap = async (req, res) => {
  try {
    const { page = 1, limit = 20, workOrder, factory, disposition } = req.query;
    const filter = { isDeleted: false };
    if (workOrder)   filter.workOrder   = workOrder;
    if (factory)     filter.factory     = factory;
    if (disposition) filter.disposition = disposition;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ProductionScrap.countDocuments(filter);
    const data  = await ProductionScrap.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('workOrder', 'orderNumber productName');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.updateScrap = async (req, res) => {
  try {
    const doc = await ProductionScrap.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Scrap');
    if (doc.status === 'approved') return fail(res, 'Approved scrap cannot be edited');
    const allowed = ['disposition','scrapValue','status','notes','approvedBy','approvedByName'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    return ok(res, doc, 'Scrap updated');
  } catch (err) { return serverError(res, err); }
};

// ─── Rework ──────────────────────────────────────────────────────────────────
exports.createRework = async (req, res) => {
  try {
    const { workOrder, reworkType } = req.body;
    if (!workOrder || !reworkType) return fail(res, 'workOrder and reworkType are required');
    const doc = await ProductionRework.create(req.body);
    await ProductionEvent.create({ eventType: 'rework_started', workOrder: doc.workOrder, factory: doc.factory, message: `Rework ${doc.reworkNumber} started: ${reworkType}`, severity: 'warning', metadata: { reworkId: doc._id } });
    return created(res, doc, 'Rework created');
  } catch (err) { return serverError(res, err); }
};

exports.getRework = async (req, res) => {
  try {
    const { page = 1, limit = 20, workOrder, factory, status } = req.query;
    const filter = { isDeleted: false };
    if (workOrder) filter.workOrder = workOrder;
    if (factory)   filter.factory   = factory;
    if (status)    filter.status    = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ProductionRework.countDocuments(filter);
    const data  = await ProductionRework.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('workOrder', 'orderNumber productName');
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.updateRework = async (req, res) => {
  try {
    const doc = await ProductionRework.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Rework');
    const allowed = ['status','result','reworkCost','reworkTimeMins','notes','completedAt','completedBy','completedByName'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    await doc.save();
    if (doc.status === 'completed') {
      await ProductionEvent.create({ eventType: 'rework_completed', workOrder: doc.workOrder, factory: doc.factory, message: `Rework ${doc.reworkNumber} completed`, severity: 'info', metadata: { reworkId: doc._id, result: doc.result } });
    }
    return ok(res, doc, 'Rework updated');
  } catch (err) { return serverError(res, err); }
};
