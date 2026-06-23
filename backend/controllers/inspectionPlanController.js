'use strict';
const InspectionPlan = require('../models/InspectionPlan');
const InspectionCharacteristic = require('../models/InspectionCharacteristic');
const InspectionMethod = require('../models/InspectionMethod');
const InspectionLot = require('../models/InspectionLot');
const InspectionResult = require('../models/InspectionResult');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/response');

// ── Inspection Plans ──────────────────────────────────────────────────────────
exports.getInspectionPlans = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, inspectionType, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (inspectionType) filter.inspectionType = inspectionType;
    if (search) filter.$or = [
      { planNumber: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
    const total = await InspectionPlan.countDocuments(filter);
    const data = await InspectionPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Inspection plans retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createInspectionPlan = async (req, res) => {
  try {
    const plan = await InspectionPlan.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'InspectionPlan', entityId: plan._id, entityLabel: plan.planNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('qms:inspection_plan_created', { id: plan._id, planNumber: plan.planNumber });
    return success(res, plan, 'Inspection plan created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getInspectionPlan = async (req, res) => {
  try {
    const plan = await InspectionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return error(res, 'Inspection plan not found', 404);
    return success(res, plan);
  } catch (err) { return error(res, err.message); }
};

exports.updateInspectionPlan = async (req, res) => {
  try {
    const before = await InspectionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Inspection plan not found', 404);
    const plan = await InspectionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'InspectionPlan', entityId: plan._id, entityLabel: plan.planNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, plan, 'Inspection plan updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteInspectionPlan = async (req, res) => {
  try {
    const plan = await InspectionPlan.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!plan) return error(res, 'Inspection plan not found', 404);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'delete', entity: 'InspectionPlan', entityId: plan._id, entityLabel: plan.planNumber, changes: { before: plan.toObject(), after: null }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, null, 'Inspection plan deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Inspection Characteristics ────────────────────────────────────────────────
exports.getCharacteristics = async (req, res) => {
  try {
    const { planId } = req.params;
    const data = await InspectionCharacteristic.find({ inspectionPlan: planId, isDeleted: false }).sort({ sequence: 1 });
    return success(res, data);
  } catch (err) { return error(res, err.message); }
};

exports.createCharacteristic = async (req, res) => {
  try {
    const char = await InspectionCharacteristic.create({ ...req.body, inspectionPlan: req.params.planId });
    return success(res, char, 'Characteristic created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateCharacteristic = async (req, res) => {
  try {
    const char = await InspectionCharacteristic.findOneAndUpdate({ _id: req.params.charId, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!char) return error(res, 'Characteristic not found', 404);
    return success(res, char, 'Characteristic updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteCharacteristic = async (req, res) => {
  try {
    const char = await InspectionCharacteristic.findOneAndUpdate({ _id: req.params.charId, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!char) return error(res, 'Characteristic not found', 404);
    return success(res, null, 'Characteristic deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Inspection Methods ────────────────────────────────────────────────────────
exports.getInspectionMethods = async (req, res) => {
  try {
    const { methodType, search } = req.query;
    const filter = { isDeleted: false };
    if (methodType) filter.methodType = methodType;
    if (search) filter.$or = [
      { code: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
    const data = await InspectionMethod.find(filter).sort({ code: 1 });
    return success(res, data);
  } catch (err) { return error(res, err.message); }
};

exports.createInspectionMethod = async (req, res) => {
  try {
    const method = await InspectionMethod.create(req.body);
    return success(res, method, 'Inspection method created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateInspectionMethod = async (req, res) => {
  try {
    const method = await InspectionMethod.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!method) return error(res, 'Method not found', 404);
    return success(res, method, 'Method updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteInspectionMethod = async (req, res) => {
  try {
    const method = await InspectionMethod.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!method) return error(res, 'Method not found', 404);
    return success(res, null, 'Method deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Inspection Lots ───────────────────────────────────────────────────────────
exports.getInspectionLots = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, inspectionType, source, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (inspectionType) filter.inspectionType = inspectionType;
    if (source) filter.source = source;
    if (search) filter.$or = [
      { lotNumber: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
    ];
    const total = await InspectionLot.countDocuments(filter);
    const data = await InspectionLot.find(filter)
      .populate('inspectionPlan', 'planNumber name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Inspection lots retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createInspectionLot = async (req, res) => {
  try {
    const lot = await InspectionLot.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'InspectionLot', entityId: lot._id, entityLabel: lot.lotNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('qms:inspection_created', { id: lot._id, lotNumber: lot.lotNumber });
    return success(res, lot, 'Inspection lot created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getInspectionLot = async (req, res) => {
  try {
    const lot = await InspectionLot.findOne({ _id: req.params.id, isDeleted: false })
      .populate('inspectionPlan', 'planNumber name')
      .populate('product', 'name sku')
      .populate('vendor', 'name vendorCode');
    if (!lot) return error(res, 'Inspection lot not found', 404);
    const results = await InspectionResult.find({ inspectionLot: lot._id, isDeleted: false }).sort({ sampleNumber: 1 });
    return success(res, { lot, results });
  } catch (err) { return error(res, err.message); }
};

exports.updateInspectionLot = async (req, res) => {
  try {
    const before = await InspectionLot.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Inspection lot not found', 404);
    const lot = await InspectionLot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (lot.status === 'passed' || lot.status === 'failed') {
      const io = req.app.locals.io;
      if (io) io.emit('qms:inspection_completed', { id: lot._id, lotNumber: lot.lotNumber, result: lot.status });
    }
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'InspectionLot', entityId: lot._id, entityLabel: lot.lotNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, lot, 'Inspection lot updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteInspectionLot = async (req, res) => {
  try {
    const lot = await InspectionLot.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!lot) return error(res, 'Inspection lot not found', 404);
    return success(res, null, 'Inspection lot deleted');
  } catch (err) { return error(res, err.message); }
};

// ── Inspection Results ────────────────────────────────────────────────────────
exports.createInspectionResult = async (req, res) => {
  try {
    const result = await InspectionResult.create(req.body);
    return success(res, result, 'Result recorded', 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateInspectionResult = async (req, res) => {
  try {
    const result = await InspectionResult.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!result) return error(res, 'Result not found', 404);
    return success(res, result, 'Result updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteInspectionResult = async (req, res) => {
  try {
    const result = await InspectionResult.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!result) return error(res, 'Result not found', 404);
    return success(res, null, 'Result deleted');
  } catch (err) { return error(res, err.message); }
};
