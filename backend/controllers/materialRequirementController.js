'use strict';
const MaterialRequirement = require('../models/MaterialRequirement');
const { ok, paginated, notFound, serverError } = require('../utils/response');

exports.getRequirements = async (req, res) => {
  try {
    const { page = 1, limit = 20, mrpRun, material, status, bomLevel } = req.query;
    const filter = { isDeleted: false };
    if (mrpRun)   filter.mrpRun   = mrpRun;
    if (material) filter.material = material;
    if (status)   filter.status   = status;
    if (bomLevel) filter.bomLevel = Number(bomLevel);
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MaterialRequirement.countDocuments(filter);
    const data  = await MaterialRequirement.find(filter)
      .sort({ shortageQty: -1, grossRequirement: -1 })
      .skip(skip).limit(Number(limit))
      .populate('material', 'name sku')
      .populate('mrpRun', 'runNumber status');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getRequirement = async (req, res) => {
  try {
    const doc = await MaterialRequirement.findOne({ _id: req.params.id, isDeleted: false })
      .populate('material', 'name sku')
      .populate('mrpRun', 'runNumber status')
      .populate('finishedProduct', 'name sku')
      .populate('productionOrder', 'orderNumber')
      .populate('productionPlan', 'planNumber name');
    if (!doc) return notFound(res, 'Material requirement not found');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.getRequirementsByRun = async (req, res) => {
  try {
    const { mrpRunId } = req.params;
    const { status } = req.query;
    const filter = { mrpRun: mrpRunId, isDeleted: false };
    if (status) filter.status = status;
    const data = await MaterialRequirement.find(filter)
      .sort({ shortageQty: -1 })
      .populate('material', 'name sku');
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};
