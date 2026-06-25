const WarehouseSettings = require('../models/WarehouseSettings');
const Warehouse         = require('../models/Warehouse');
const { ok, fail, notFound, serverError } = require('../utils/response');

// ── Get settings for a warehouse ──────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const wh = await Warehouse.findOne({ _id: warehouseId, isDeleted: false });
    if (!wh) return notFound(res, 'Warehouse');

    let settings = await WarehouseSettings.findOne({ warehouse: warehouseId })
      .populate('defaultReceivingZone', 'code name type')
      .populate('defaultDispatchZone',  'code name type');

    if (!settings) {
      settings = await WarehouseSettings.create({ warehouse: warehouseId });
    }

    return ok(res, settings);
  } catch (err) { return serverError(res, err); }
};

// ── Update settings for a warehouse ──────────────────────────────────────────
exports.updateSettings = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const wh = await Warehouse.findOne({ _id: warehouseId, isDeleted: false });
    if (!wh) return notFound(res, 'Warehouse');

    const allowed = [
      'defaultReceivingZone', 'defaultDispatchZone', 'autoBinAllocation',
      'barcodePrefix', 'qrPrefix', 'workingHoursStart', 'workingHoursEnd',
      'workingDays', 'capacityWarningPct', 'lowStockThreshold', 'autoGRNApproval',
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.capacityWarningPct !== undefined) {
      const pct = Number(updates.capacityWarningPct);
      if (pct < 10 || pct > 100) return fail(res, 'capacityWarningPct must be 10–100');
      updates.capacityWarningPct = pct;
    }

    const settings = await WarehouseSettings.findOneAndUpdate(
      { warehouse: warehouseId },
      updates,
      { new: true, upsert: true, runValidators: true }
    )
      .populate('defaultReceivingZone', 'code name type')
      .populate('defaultDispatchZone',  'code name type');

    return ok(res, settings, 'Settings updated');
  } catch (err) { return serverError(res, err); }
};
