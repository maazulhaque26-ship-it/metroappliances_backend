'use strict';
const Asset           = require('../models/Asset');
const AssetCategory   = require('../models/AssetCategory');
const AssetLocation   = require('../models/AssetLocation');
const AssetHierarchy  = require('../models/AssetHierarchy');
const AssetDocument   = require('../models/AssetDocument');
const AssetDepreciation = require('../models/AssetDepreciation');
const AssetWarranty   = require('../models/AssetWarranty');
const AssetLifecycle  = require('../models/AssetLifecycle');
const AuditLog        = require('../models/AuditLog');
const { success, error, paginated, notFound, serverError } = require('../utils/response');

// ── Asset CRUD ──────────────────────────────────────────────────────────────

exports.getAssets = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, assetType, status, location, category } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { assetNumber: { $regex: search, $options: 'i' } },
      { serialNumber: { $regex: search, $options: 'i' } },
    ];
    if (assetType) filter.assetType = assetType;
    if (status) filter.status = status;
    if (location) filter.location = location;
    if (category) filter.category = category;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Asset.find(filter)
        .populate('category', 'name code')
        .populate('location', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Asset.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, isDeleted: false })
      .populate('category', 'name code depreciationMethod usefulLife')
      .populate('location', 'name code locationType')
      .populate('parentAsset', 'name assetNumber')
      .populate('assignedTo', 'name email');
    if (!asset) return notFound(res, 'Asset not found');
    const [docs, warranties, lifecycle] = await Promise.all([
      AssetDocument.find({ asset: asset._id, isDeleted: false }),
      AssetWarranty.find({ asset: asset._id, isDeleted: false }),
      AssetLifecycle.find({ asset: asset._id, isDeleted: false }).sort({ eventDate: -1 }).limit(20),
    ]);
    return success(res, { asset, docs, warranties, lifecycle });
  } catch (e) { return serverError(res, e.message); }
};

exports.createAsset = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('eam:asset_created', { assetId: asset._id, assetNumber: asset.assetNumber, name: asset.name });
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'CREATE', entity: 'Asset',
      entityId: asset._id, entityLabel: asset.assetNumber,
      changes: { after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, asset, 'Asset created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateAsset = async (req, res) => {
  try {
    const before = await Asset.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return notFound(res, 'Asset not found');
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email,
      adminRole: req.user.role, action: 'UPDATE', entity: 'Asset',
      entityId: asset._id, entityLabel: asset.assetNumber,
      changes: { before, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'],
    });
    return success(res, asset, 'Asset updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true }, { new: true }
    );
    if (!asset) return notFound(res, 'Asset not found');
    return success(res, null, 'Asset deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Category CRUD ──────────────────────────────────────────────────────

exports.getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AssetCategory.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      AssetCategory.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await AssetCategory.create(req.body);
    return success(res, category, 'Category created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await AssetCategory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!category) return notFound(res, 'Category not found');
    return success(res, category, 'Category updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await AssetCategory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!category) return notFound(res, 'Category not found');
    return success(res, null, 'Category deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Location CRUD ───────────────────────────────────────────────────────

exports.getLocations = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AssetLocation.find(filter)
        .populate('parentLocation', 'name code')
        .sort({ name: 1 }).skip(skip).limit(Number(limit)),
      AssetLocation.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.createLocation = async (req, res) => {
  try {
    const location = await AssetLocation.create(req.body);
    return success(res, location, 'Location created', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateLocation = async (req, res) => {
  try {
    const location = await AssetLocation.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!location) return notFound(res, 'Location not found');
    return success(res, location, 'Location updated');
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteLocation = async (req, res) => {
  try {
    const location = await AssetLocation.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!location) return notFound(res, 'Location not found');
    return success(res, null, 'Location deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Hierarchy ───────────────────────────────────────────────────────────

exports.getHierarchy = async (req, res) => {
  try {
    const hierarchy = await AssetHierarchy.findOne({ asset: req.params.assetId })
      .populate({ path: 'children', populate: { path: 'children' } });
    return success(res, hierarchy);
  } catch (e) { return serverError(res, e.message); }
};

exports.upsertHierarchy = async (req, res) => {
  try {
    const { assetId } = req.params;
    const hierarchy = await AssetHierarchy.findOneAndUpdate(
      { asset: assetId }, { ...req.body, asset: assetId },
      { new: true, upsert: true, runValidators: true }
    );
    return success(res, hierarchy, 'Hierarchy updated');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Documents ───────────────────────────────────────────────────────────

exports.getDocuments = async (req, res) => {
  try {
    const docs = await AssetDocument.find({ asset: req.params.assetId, isDeleted: false }).sort({ createdAt: -1 });
    return success(res, docs);
  } catch (e) { return serverError(res, e.message); }
};

exports.addDocument = async (req, res) => {
  try {
    const doc = await AssetDocument.create({ ...req.body, asset: req.params.assetId });
    return success(res, doc, 'Document added', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await AssetDocument.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
    );
    if (!doc) return notFound(res, 'Document not found');
    return success(res, null, 'Document deleted');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Depreciation ────────────────────────────────────────────────────────

exports.getDepreciation = async (req, res) => {
  try {
    const dep = await AssetDepreciation.findOne({ asset: req.params.assetId, isDeleted: false });
    return success(res, dep);
  } catch (e) { return serverError(res, e.message); }
};

exports.createDepreciation = async (req, res) => {
  try {
    const dep = await AssetDepreciation.create({ ...req.body, asset: req.params.assetId });
    return success(res, dep, 'Depreciation schedule created', 201);
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Warranty ────────────────────────────────────────────────────────────

exports.getWarranties = async (req, res) => {
  try {
    const warranties = await AssetWarranty.find({ asset: req.params.assetId, isDeleted: false }).sort({ startDate: -1 });
    return success(res, warranties);
  } catch (e) { return serverError(res, e.message); }
};

exports.createWarranty = async (req, res) => {
  try {
    const warranty = await AssetWarranty.create({ ...req.body, asset: req.params.assetId });
    return success(res, warranty, 'Warranty added', 201);
  } catch (e) { return serverError(res, e.message); }
};

exports.updateWarranty = async (req, res) => {
  try {
    const warranty = await AssetWarranty.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }
    );
    if (!warranty) return notFound(res, 'Warranty not found');
    return success(res, warranty, 'Warranty updated');
  } catch (e) { return serverError(res, e.message); }
};

// ── Asset Lifecycle ───────────────────────────────────────────────────────────

exports.getLifecycle = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { asset: req.params.assetId, isDeleted: false };
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AssetLifecycle.find(filter).sort({ eventDate: -1 }).skip(skip).limit(Number(limit)),
      AssetLifecycle.countDocuments(filter),
    ]);
    return paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { return serverError(res, e.message); }
};

exports.addLifecycleEvent = async (req, res) => {
  try {
    const event = await AssetLifecycle.create({ ...req.body, asset: req.params.assetId });
    return success(res, event, 'Lifecycle event recorded', 201);
  } catch (e) { return serverError(res, e.message); }
};
