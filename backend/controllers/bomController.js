'use strict';
const BillOfMaterials = require('../models/BillOfMaterials');
const BOMItem         = require('../models/BOMItem');
const AuditLog        = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError, noContent } = require('../utils/response');

function audit(req, action, bom, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id, adminName: req.user.name || '', adminEmail: req.user.email || '',
      adminRole: req.user.role || 'admin', action, entity: 'BillOfMaterials',
      entityId: bom._id, entityLabel: bom.bomNumber || bom.productName,
      changes: { before, after: bom.toObject ? bom.toObject() : bom },
      ip: req.ip, userAgent: req.get('user-agent') || '',
    });
  } catch (_) {}
}

exports.createBOM = async (req, res) => {
  try {
    const { items = [], ...bomData } = req.body;
    const bom = await BillOfMaterials.create(bomData);
    if (items.length) {
      const created_items = await BOMItem.insertMany(
        items.map(i => ({ ...i, bom: bom._id }))
      );
      bom.items = created_items.map(i => i._id);
      await bom.save();
    }
    audit(req, 'BOM_CREATED', bom);
    const populated = await BillOfMaterials.findById(bom._id).populate('items');
    return created(res, populated, 'Bill of Materials created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getBOMs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, product } = req.query;
    const filter = { isDeleted: false };
    if (status)  filter.status  = status;
    if (product) filter.product = product;
    if (search)  filter.$or = [
      { bomNumber:   { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
    ];
    const total = await BillOfMaterials.countDocuments(filter);
    const data  = await BillOfMaterials.find(filter)
      .populate('product', 'name sku')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit)).limit(Number(limit))
      .select('-items');
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getBOM = async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product', 'name sku price')
      .populate('approvedBy', 'name email')
      .populate({ path: 'items', match: { isDeleted: false }, populate: { path: 'rawMaterial', select: 'name sku price' } });
    if (!bom) return notFound(res, 'BOM');
    return ok(res, bom);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getBOMByProduct = async (req, res) => {
  try {
    const boms = await BillOfMaterials.find({ product: req.params.productId, isDeleted: false })
      .populate('product', 'name sku')
      .sort({ version: -1 });
    return ok(res, boms);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateBOM = async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({ _id: req.params.id, isDeleted: false });
    if (!bom) return notFound(res, 'BOM');
    if (bom.status === 'active') return fail(res, 'Cannot edit an active BOM — clone it first');
    const before = bom.toObject();
    const { items, ...updates } = req.body;
    Object.assign(bom, updates);
    await bom.save();
    if (Array.isArray(items)) {
      await BOMItem.deleteMany({ bom: bom._id });
      const newItems = await BOMItem.insertMany(items.map(i => ({ ...i, bom: bom._id })));
      bom.items = newItems.map(i => i._id);
      await bom.save();
    }
    audit(req, 'BOM_UPDATED', bom, before);
    const populated = await BillOfMaterials.findById(bom._id).populate('items');
    return ok(res, populated, 'BOM updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteBOM = async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: { $ne: 'active' } },
      { isDeleted: true },
      { new: true }
    );
    if (!bom) return notFound(res, 'BOM (active BOMs cannot be deleted)');
    await BOMItem.updateMany({ bom: bom._id }, { isDeleted: true });
    audit(req, 'BOM_DELETED', bom);
    return noContent(res, 'BOM deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.approveBOM = async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({ _id: req.params.id, isDeleted: false });
    if (!bom) return notFound(res, 'BOM');
    if (bom.status !== 'draft') return fail(res, 'Only draft BOMs can be approved');
    const before = bom.toObject();
    bom.status     = 'approved';
    bom.approvedBy = req.user._id;
    bom.approvedAt = new Date();
    await bom.save();
    audit(req, 'BOM_APPROVED', bom, before);
    return ok(res, bom, 'BOM approved');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.cloneBOM = async (req, res) => {
  try {
    const source = await BillOfMaterials.findOne({ _id: req.params.id, isDeleted: false })
      .populate({ path: 'items', match: { isDeleted: false } });
    if (!source) return notFound(res, 'BOM');
    const newRevision = (source.revision || 1) + 1;
    const clone = await BillOfMaterials.create({
      product: source.product, productName: source.productName, productSKU: source.productSKU,
      version: `${Math.floor(source.revision || 1) + 1}.0`, revision: newRevision,
      estimatedCostPerUnit: source.estimatedCostPerUnit, notes: `Cloned from ${source.bomNumber}`,
    });
    if (source.items?.length) {
      const clonedItems = await BOMItem.insertMany(
        source.items.map(i => ({
          bom: clone._id, rawMaterial: i.rawMaterial, rawMaterialName: i.rawMaterialName,
          rawMaterialSKU: i.rawMaterialSKU, quantity: i.quantity, unit: i.unit,
          wasteAllowance: i.wasteAllowance, unitCost: i.unitCost, sequence: i.sequence,
        }))
      );
      clone.items = clonedItems.map(i => i._id);
      await clone.save();
    }
    audit(req, 'BOM_CLONED', clone);
    const populated = await BillOfMaterials.findById(clone._id).populate('items');
    return created(res, populated, 'BOM cloned');
  } catch (err) {
    return serverError(res, err);
  }
};
