'use strict';
const InventoryProjection = require('../models/InventoryProjection');
const { ok, paginated, notFound, serverError } = require('../utils/response');

exports.getProjections = async (req, res) => {
  try {
    const { page = 1, limit = 20, mrpRun, material, isBelowSafety } = req.query;
    const filter = { isDeleted: false };
    if (mrpRun)   filter.mrpRun   = mrpRun;
    if (material) filter.material = material;
    if (isBelowSafety !== undefined) filter.isBelowSafety = isBelowSafety === 'true';
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await InventoryProjection.countDocuments(filter);
    const data  = await InventoryProjection.find(filter)
      .sort({ isBelowSafety: -1, projectedQty: 1 })
      .skip(skip).limit(Number(limit))
      .populate('material',  'name sku')
      .populate('mrpRun',    'runNumber')
      .populate('warehouse', 'name code');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getProjection = async (req, res) => {
  try {
    const doc = await InventoryProjection.findOne({ _id: req.params.id, isDeleted: false })
      .populate('material',  'name sku')
      .populate('mrpRun',    'runNumber status')
      .populate('warehouse', 'name code');
    if (!doc) return notFound(res, 'Inventory projection not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getProjectionsByRun = async (req, res) => {
  try {
    const data = await InventoryProjection.find({ mrpRun: req.params.mrpRunId, isDeleted: false })
      .sort({ isBelowSafety: -1, projectedQty: 1 })
      .populate('material', 'name sku');
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};
