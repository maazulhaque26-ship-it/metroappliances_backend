'use strict';
const SafetyStockRule = require('../models/SafetyStockRule');
const AuditLog        = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, fail, serverError } = require('../utils/response');

exports.getRules = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouse, isActive } = req.query;
    const filter = { isDeleted: false };
    if (warehouse) filter.warehouse = warehouse;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await SafetyStockRule.countDocuments(filter);
    const data  = await SafetyStockRule.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .populate('material',  'name sku')
      .populate('warehouse', 'name code');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getRule = async (req, res) => {
  try {
    const doc = await SafetyStockRule.findOne({ _id: req.params.id, isDeleted: false })
      .populate('material',  'name sku')
      .populate('warehouse', 'name code');
    if (!doc) return notFound(res, 'Safety stock rule not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createRule = async (req, res) => {
  try {
    const { material, materialName, materialSKU, warehouse, unit, safetyStockQty, reorderPoint, reorderQty, maxStockQty, averageDailyUsage, leadTimeDays, demandVariability, serviceLevel, method, notes } = req.body;
    if (!material || safetyStockQty === undefined || reorderPoint === undefined) return fail(res, 'material, safetyStockQty and reorderPoint are required');
    const existing = await SafetyStockRule.findOne({ material, isDeleted: false });
    if (existing) return fail(res, 'A safety stock rule for this material already exists');
    const doc = await SafetyStockRule.create({ material, materialName, materialSKU, warehouse, unit, safetyStockQty, reorderPoint, reorderQty, maxStockQty, averageDailyUsage, leadTimeDays, demandVariability, serviceLevel, method, notes, lastCalculated: new Date() });
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'create', entity: 'SafetyStockRule',
      entityId: doc._id, entityLabel: doc.materialName,
      changes: { before: null, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return created(res, doc, 'Safety stock rule created');
  } catch (err) { return serverError(res, err); }
};

exports.updateRule = async (req, res) => {
  try {
    const doc = await SafetyStockRule.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Safety stock rule not found');
    const before = doc.toObject();
    const allowed = ['safetyStockQty','reorderPoint','reorderQty','maxStockQty','averageDailyUsage','leadTimeDays','demandVariability','serviceLevel','method','isActive','notes','unit'];
    for (const k of allowed) if (req.body[k] !== undefined) doc[k] = req.body[k];
    doc.lastCalculated = new Date();
    await doc.save();
    await AuditLog.create({
      admin: req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole: req.user?.role || 'admin', action: 'update', entity: 'SafetyStockRule',
      entityId: doc._id, entityLabel: doc.materialName,
      changes: { before, after: doc.toObject() },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return ok(res, doc, 'Safety stock rule updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteRule = async (req, res) => {
  try {
    const doc = await SafetyStockRule.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Safety stock rule not found');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res);
  } catch (err) { return serverError(res, err); }
};
