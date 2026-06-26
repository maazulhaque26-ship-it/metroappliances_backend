'use strict';
const SalaryStructure = require('../models/SalaryStructure');
const SalaryComponent = require('../models/SalaryComponent');
const AuditLog        = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── Salary Components ─────────────────────────────────────────────────────────

exports.getComponents = async (req, res) => {
  try {
    const { type, isActive, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (type)     filter.type     = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      SalaryComponent.find(filter).sort({ type: 1, sortOrder: 1, name: 1 }).skip(skip).limit(Number(limit)),
      SalaryComponent.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createComponent = async (req, res) => {
  try {
    const doc = await SalaryComponent.create(req.body);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'SalaryComponent', entityId: doc._id, entityLabel: doc.name, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Salary component created');
  } catch (e) { return serverError(res, e); }
};

exports.getComponent = async (req, res) => {
  try {
    const doc = await SalaryComponent.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Salary component');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateComponent = async (req, res) => {
  try {
    const doc = await SalaryComponent.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Salary component');
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'UPDATE', entity: 'SalaryComponent', entityId: doc._id, entityLabel: doc.name, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, doc, 'Salary component updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteComponent = async (req, res) => {
  try {
    const doc = await SalaryComponent.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Salary component');
    doc.isDeleted = true;
    await doc.save();
    return ok(res, null, 'Salary component deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Salary Structures ─────────────────────────────────────────────────────────

exports.getStructures = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      SalaryStructure.find(filter).populate('components', 'name type value calculationType').sort({ name: 1 }).skip(skip).limit(Number(limit)),
      SalaryStructure.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e); }
};

exports.createStructure = async (req, res) => {
  try {
    if (req.body.isDefault) {
      await SalaryStructure.updateMany({ isDefault: true, isDeleted: false }, { isDefault: false });
    }
    const doc = await SalaryStructure.create(req.body);
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'CREATE', entity: 'SalaryStructure', entityId: doc._id, entityLabel: doc.name, changes: { before: null, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return created(res, doc, 'Salary structure created');
  } catch (e) { return serverError(res, e); }
};

exports.getStructure = async (req, res) => {
  try {
    const doc = await SalaryStructure.findOne({ _id: req.params.id, isDeleted: false }).populate('components');
    if (!doc) return notFound(res, 'Salary structure');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.updateStructure = async (req, res) => {
  try {
    const doc = await SalaryStructure.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Salary structure');
    if (req.body.isDefault && !doc.isDefault) {
      await SalaryStructure.updateMany({ isDefault: true, isDeleted: false }, { isDefault: false });
    }
    const before = doc.toObject();
    Object.assign(doc, req.body);
    await doc.save();
    setImmediate(async () => { try { await AuditLog.create({ admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role, action: 'UPDATE', entity: 'SalaryStructure', entityId: doc._id, entityLabel: doc.name, changes: { before, after: doc.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'] }); } catch (_) {} });
    return ok(res, doc, 'Salary structure updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteStructure = async (req, res) => {
  try {
    const doc = await SalaryStructure.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Salary structure');
    doc.isDeleted = true;
    await doc.save();
    return ok(res, null, 'Salary structure deleted');
  } catch (e) { return serverError(res, e); }
};
