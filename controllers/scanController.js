/**
 * Sprint 10E — Scanner Engine Controller
 * Validates scans, logs activity, resolves entities, enforces scan rules
 */
const ScanLog        = require('../models/ScanLog');
const Barcode        = require('../models/Barcode');
const Inventory      = require('../models/Inventory');
const SerialNumber   = require('../models/SerialNumber');
const Batch          = require('../models/Batch');
const StorageLocation= require('../models/StorageLocation');
const Product        = require('../models/Product');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── Core scan resolver ────────────────────────────────────────────────────────

async function resolveScannedValue(rawValue) {
  const upper = rawValue.trim().toUpperCase();

  // 1. Try Barcode registry
  const barcode = await Barcode.findOne({ value: upper, isActive: true, isDeleted: false });
  if (barcode) {
    return { entityType: barcode.entityType, entityId: barcode.entityId, label: barcode.label, via: 'barcode_registry' };
  }

  // 2. Try StorageLocation barcode field
  const loc = await StorageLocation.findOne({ barcode: upper, isDeleted: false });
  if (loc) {
    return { entityType: 'storage_location', entityId: loc._id, label: `${loc.rack}-${loc.shelf}${loc.bin ? '-' + loc.bin : ''}`, via: 'storage_location' };
  }

  // 3. Try Product SKU
  const product = await Product.findOne({ sku: upper });
  if (product) {
    return { entityType: 'product', entityId: product._id, label: product.name, via: 'product_sku' };
  }

  // 4. Try Serial Number
  const serial = await SerialNumber.findOne({ serialNumber: upper });
  if (serial) {
    return { entityType: 'product', entityId: serial.product, label: `Serial: ${serial.serialNumber}`, via: 'serial' };
  }

  // 5. Try Batch number
  const batch = await Batch.findOne({ batchNumber: upper });
  if (batch) {
    return { entityType: 'product', entityId: batch.product, label: `Batch: ${batch.batchNumber}`, via: 'batch' };
  }

  return null;
}

// ─── Scan validation rules ─────────────────────────────────────────────────────

async function validateScan(resolved, action, context) {
  if (!resolved) return { result: 'not_found', errorMessage: 'Barcode not found in system' };

  // Expired batch check
  if (resolved.via === 'batch') {
    const batch = await Batch.findOne({ batchNumber: context?.batchNumber });
    if (batch?.expiryDate && new Date(batch.expiryDate) < new Date()) {
      return { result: 'expired_batch', errorMessage: `Batch expired on ${batch.expiryDate.toDateString()}` };
    }
  }

  return { result: 'success', errorMessage: null };
}

// ─── Controllers ───────────────────────────────────────────────────────────────

exports.processScan = async (req, res) => {
  try {
    const { rawValue, action, scanType = 'barcode', deviceType = 'manual',
            contextType, contextId, sessionId } = req.body;

    if (!rawValue || !action) return fail(res, 'rawValue and action are required');

    const startTime = Date.now();
    const resolved  = await resolveScannedValue(rawValue);
    const validation = await validateScan(resolved, action, req.body.context || {});
    const durationMs = Date.now() - startTime;

    const log = await ScanLog.create({
      warehouseUser: req.warehouseUser?._id,
      adminUser:     req.user?._id,
      warehouse:     req.warehouseUser?.warehouse,
      rawValue,
      scanType,
      action,
      resolvedEntityType: resolved?.entityType,
      resolvedEntityId:   resolved?.entityId,
      resolvedLabel:      resolved?.label,
      contextType,
      contextId,
      result:      validation.result,
      errorMessage:validation.errorMessage,
      deviceType,
      sessionId,
      durationMs,
    });

    if (validation.result !== 'success') {
      return ok(res, { success: false, result: validation.result,
                        errorMessage: validation.errorMessage, log: log._id });
    }

    return ok(res, {
      success: true,
      result: 'success',
      resolved,
      log: log._id,
      durationMs,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getScanLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, result, deviceType,
            warehouseId, userId, search, from, to } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = {};

    if (action)      filter.action    = action;
    if (result)      filter.result    = result;
    if (deviceType)  filter.deviceType= deviceType;
    if (warehouseId) filter.warehouse = warehouseId;
    if (userId)      filter.$or = [{ warehouseUser: userId }, { adminUser: userId }];
    if (search)      filter.$or = [
      { rawValue: { $regex: search, $options: 'i' } },
      { resolvedLabel: { $regex: search, $options: 'i' } },
    ];
    if (from || to) {
      filter.scannedAt = {};
      if (from) filter.scannedAt.$gte = new Date(from);
      if (to)   filter.scannedAt.$lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      ScanLog.find(filter)
        .populate('warehouseUser', 'name role')
        .populate('warehouse', 'name code')
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ScanLog.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getScanActivity = async (req, res) => {
  try {
    const { warehouseId, days = 7 } = req.query;
    const since  = new Date(Date.now() - Number(days) * 86400000);
    const match  = { scannedAt: { $gte: since } };
    if (warehouseId) match.warehouse = require('mongoose').Types.ObjectId.createFromHexString(warehouseId);

    const [totals, byAction, byResult, byDevice, byHour, recentFailures] = await Promise.all([
      ScanLog.countDocuments(match),
      ScanLog.aggregate([
        { $match: match },
        { $group: { _id: '$action', count: { $sum: 1 }, avgMs: { $avg: '$durationMs' } } },
        { $sort: { count: -1 } },
      ]),
      ScanLog.aggregate([
        { $match: match },
        { $group: { _id: '$result', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ScanLog.aggregate([
        { $match: match },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      ]),
      ScanLog.aggregate([
        { $match: match },
        { $group: { _id: { $hour: '$scannedAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),
      ScanLog.find({ ...match, result: { $ne: 'success' } })
        .sort({ scannedAt: -1 }).limit(20)
        .populate('warehouseUser', 'name'),
    ]);

    const successCount = byResult.find(r => r._id === 'success')?.count || 0;
    const accuracy     = totals > 0 ? ((successCount / totals) * 100).toFixed(1) : '100.0';

    return ok(res, { totals, accuracy, byAction, byResult, byDevice, byHour, recentFailures });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getScanReport = async (req, res) => {
  try {
    const { from, to, warehouseId } = req.query;
    const match = {};
    if (warehouseId) match.warehouse = require('mongoose').Types.ObjectId.createFromHexString(warehouseId);
    if (from || to) {
      match.scannedAt = {};
      if (from) match.scannedAt.$gte = new Date(from);
      if (to)   match.scannedAt.$lte = new Date(to);
    }

    const [daily, topUsers, failureReasons] = await Promise.all([
      ScanLog.aggregate([
        { $match: match },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
          total:   { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] } },
          failed:  { $sum: { $cond: [{ $ne:  ['$result', 'success'] }, 1, 0] } },
        } },
        { $sort: { _id: 1 } },
      ]),
      ScanLog.aggregate([
        { $match: { ...match, warehouseUser: { $exists: true } } },
        { $group: { _id: '$warehouseUser', count: { $sum: 1 }, failures: { $sum: { $cond: [{ $ne: ['$result', 'success'] }, 1, 0] } } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'warehouseusers', localField: '_id', foreignField: '_id', as: 'user' } },
      ]),
      ScanLog.aggregate([
        { $match: { ...match, result: { $ne: 'success' } } },
        { $group: { _id: '$result', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return ok(res, { daily, topUsers, failureReasons });
  } catch (err) {
    return serverError(res, err);
  }
};

// Warehouse portal: scan endpoint (simplified — no admin context)
exports.warehouseScan = async (req, res) => {
  try {
    const { rawValue, action, scanType = 'barcode', deviceType = 'manual', sessionId } = req.body;
    if (!rawValue || !action) return fail(res, 'rawValue and action are required');

    const startTime = Date.now();
    const resolved  = await resolveScannedValue(rawValue);
    const validation = await validateScan(resolved, action, {});
    const durationMs = Date.now() - startTime;

    await ScanLog.create({
      warehouseUser: req.warehouseUser._id,
      warehouse:     req.warehouseUser.warehouse,
      rawValue, scanType, action, deviceType, sessionId,
      resolvedEntityType: resolved?.entityType,
      resolvedEntityId:   resolved?.entityId,
      resolvedLabel:      resolved?.label,
      result: validation.result,
      errorMessage: validation.errorMessage,
      durationMs,
    });

    return ok(res, { success: validation.result === 'success',
                      result: validation.result,
                      errorMessage: validation.errorMessage,
                      resolved, durationMs });
  } catch (err) {
    return serverError(res, err);
  }
};
