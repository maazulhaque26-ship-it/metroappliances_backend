'use strict';
const CAPA = require('../models/CAPA');
const NCReport = require('../models/NCReport');
const RootCauseAnalysis = require('../models/RootCauseAnalysis');
const CorrectiveAction = require('../models/CorrectiveAction');
const PreventiveAction = require('../models/PreventiveAction');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/response');

// ── CAPA ──────────────────────────────────────────────────────────────────────
exports.getCAPAs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, capaType, severity, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (capaType) filter.capaType = capaType;
    if (severity) filter.severity = severity;
    if (search) filter.$or = [
      { capaNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
    const total = await CAPA.countDocuments(filter);
    const data = await CAPA.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'CAPAs retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createCAPA = async (req, res) => {
  try {
    const capa = await CAPA.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'CAPA', entityId: capa._id, entityLabel: capa.capaNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('qms:capa_created', { id: capa._id, capaNumber: capa.capaNumber, capaType: capa.capaType });
    return success(res, capa, 'CAPA created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getCAPA = async (req, res) => {
  try {
    const capa = await CAPA.findOne({ _id: req.params.id, isDeleted: false })
      .populate('ncReport', 'ncNumber title')
      .populate('qualityAudit', 'auditNumber title')
      .populate('assignedTo', 'name email');
    if (!capa) return error(res, 'CAPA not found', 404);
    const [rca, correctiveActions, preventiveActions] = await Promise.all([
      RootCauseAnalysis.findOne({ capa: capa._id, isDeleted: false }),
      CorrectiveAction.find({ capa: capa._id, isDeleted: false }).sort({ createdAt: 1 }),
      PreventiveAction.find({ capa: capa._id, isDeleted: false }).sort({ createdAt: 1 }),
    ]);
    return success(res, { capa, rca, correctiveActions, preventiveActions });
  } catch (err) { return error(res, err.message); }
};

exports.updateCAPA = async (req, res) => {
  try {
    const before = await CAPA.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'CAPA not found', 404);
    const capa = await CAPA.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (req.body.status === 'closed') {
      const io = req.app.locals.io;
      if (io) io.emit('qms:capa_closed', { id: capa._id, capaNumber: capa.capaNumber });
    }
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'CAPA', entityId: capa._id, entityLabel: capa.capaNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, capa, 'CAPA updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteCAPA = async (req, res) => {
  try {
    const capa = await CAPA.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!capa) return error(res, 'CAPA not found', 404);
    return success(res, null, 'CAPA deleted');
  } catch (err) { return error(res, err.message); }
};

// ── NCReport ──────────────────────────────────────────────────────────────────
exports.getNCReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, ncType, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (ncType) filter.ncType = ncType;
    if (search) filter.$or = [
      { ncNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
    const total = await NCReport.countDocuments(filter);
    const data = await NCReport.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'NC reports retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createNCReport = async (req, res) => {
  try {
    const ncr = await NCReport.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'NCReport', entityId: ncr._id, entityLabel: ncr.ncNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('qms:defect_found', { id: ncr._id, ncNumber: ncr.ncNumber, ncType: ncr.ncType });
    return success(res, ncr, 'NC report created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getNCReport = async (req, res) => {
  try {
    const ncr = await NCReport.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product', 'name sku')
      .populate('vendor', 'name vendorCode')
      .populate('capa', 'capaNumber status');
    if (!ncr) return error(res, 'NC report not found', 404);
    return success(res, ncr);
  } catch (err) { return error(res, err.message); }
};

exports.updateNCReport = async (req, res) => {
  try {
    const before = await NCReport.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'NC report not found', 404);
    const ncr = await NCReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'NCReport', entityId: ncr._id, entityLabel: ncr.ncNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, ncr, 'NC report updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteNCReport = async (req, res) => {
  try {
    const ncr = await NCReport.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!ncr) return error(res, 'NC report not found', 404);
    return success(res, null, 'NC report deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Root Cause Analysis ───────────────────────────────────────────────────────
exports.getRCAs = async (req, res) => {
  try {
    const { capaId } = req.query;
    const filter = { isDeleted: false };
    if (capaId) filter.capa = capaId;
    const data = await RootCauseAnalysis.find(filter).sort({ createdAt: -1 });
    return success(res, data);
  } catch (err) { return error(res, err.message); }
};

exports.createRCA = async (req, res) => {
  try {
    const rca = await RootCauseAnalysis.create(req.body);
    return success(res, rca, 'RCA created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateRCA = async (req, res) => {
  try {
    const rca = await RootCauseAnalysis.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!rca) return error(res, 'RCA not found', 404);
    return success(res, rca, 'RCA updated');
  } catch (err) { return error(res, err.message); }
};

// ── Corrective Actions ────────────────────────────────────────────────────────
exports.getCorrectiveActions = async (req, res) => {
  try {
    const { capaId, status } = req.query;
    const filter = { isDeleted: false };
    if (capaId) filter.capa = capaId;
    if (status) filter.status = status;
    const data = await CorrectiveAction.find(filter).sort({ targetDate: 1 });
    return success(res, data);
  } catch (err) { return error(res, err.message); }
};

exports.createCorrectiveAction = async (req, res) => {
  try {
    const ca = await CorrectiveAction.create(req.body);
    return success(res, ca, 'Corrective action created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateCorrectiveAction = async (req, res) => {
  try {
    const ca = await CorrectiveAction.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!ca) return error(res, 'Corrective action not found', 404);
    return success(res, ca, 'Corrective action updated');
  } catch (err) { return error(res, err.message); }
};

// ── Preventive Actions ────────────────────────────────────────────────────────
exports.getPreventiveActions = async (req, res) => {
  try {
    const { capaId, status } = req.query;
    const filter = { isDeleted: false };
    if (capaId) filter.capa = capaId;
    if (status) filter.status = status;
    const data = await PreventiveAction.find(filter).sort({ targetDate: 1 });
    return success(res, data);
  } catch (err) { return error(res, err.message); }
};

exports.createPreventiveAction = async (req, res) => {
  try {
    const pa = await PreventiveAction.create(req.body);
    return success(res, pa, 'Preventive action created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updatePreventiveAction = async (req, res) => {
  try {
    const pa = await PreventiveAction.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!pa) return error(res, 'Preventive action not found', 404);
    return success(res, pa, 'Preventive action updated');
  } catch (err) { return error(res, err.message); }
};
