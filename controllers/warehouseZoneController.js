const WarehouseZone   = require('../models/WarehouseZone');
const StorageLocation = require('../models/StorageLocation');
const Warehouse       = require('../models/Warehouse');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ── List zones (optionally filtered by warehouse) ─────────────────────────────
exports.getZones = async (req, res) => {
  try {
    const { warehouseId, type, isActive, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (type)        filter.type      = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      WarehouseZone.find(filter)
        .populate('warehouse', 'code name city')
        .sort({ warehouse: 1, type: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      WarehouseZone.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Create zone ───────────────────────────────────────────────────────────────
exports.createZone = async (req, res) => {
  try {
    const { warehouse, code, name, type, description, capacity } = req.body;
    if (!warehouse || !code || !name || !type) {
      return fail(res, 'warehouse, code, name, type are required');
    }

    const wh = await Warehouse.findOne({ _id: warehouse, isDeleted: false });
    if (!wh) return notFound(res, 'Warehouse');

    const exists = await WarehouseZone.findOne({ warehouse, code: code.toUpperCase().trim(), isDeleted: false });
    if (exists) return fail(res, `Zone code ${code.toUpperCase()} already exists in this warehouse`);

    const zone = await WarehouseZone.create({
      warehouse, code: code.toUpperCase().trim(), name, type,
      description, capacity: capacity || 0,
    });

    return created(res, zone, 'Zone created');
  } catch (err) { return serverError(res, err); }
};

// ── Get zone by ID ────────────────────────────────────────────────────────────
exports.getZoneById = async (req, res) => {
  try {
    const zone = await WarehouseZone.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouse', 'code name city');
    if (!zone) return notFound(res, 'Zone');

    const locationCount = await StorageLocation.countDocuments({ zone: zone._id, isDeleted: false });
    return ok(res, { zone, locationCount });
  } catch (err) { return serverError(res, err); }
};

// ── Update zone ───────────────────────────────────────────────────────────────
exports.updateZone = async (req, res) => {
  try {
    const allowed = ['name', 'type', 'description', 'capacity', 'isActive'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const zone = await WarehouseZone.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).populate('warehouse', 'code name city');

    if (!zone) return notFound(res, 'Zone');
    return ok(res, zone, 'Zone updated');
  } catch (err) { return serverError(res, err); }
};

// ── Toggle zone active ────────────────────────────────────────────────────────
exports.toggleZone = async (req, res) => {
  try {
    const zone = await WarehouseZone.findOne({ _id: req.params.id, isDeleted: false });
    if (!zone) return notFound(res, 'Zone');
    zone.isActive = !zone.isActive;
    await zone.save();
    return ok(res, { isActive: zone.isActive }, `Zone ${zone.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) { return serverError(res, err); }
};

// ── Soft delete zone ──────────────────────────────────────────────────────────
exports.deleteZone = async (req, res) => {
  try {
    const zone = await WarehouseZone.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );
    if (!zone) return notFound(res, 'Zone');
    return noContent(res, 'Zone deleted');
  } catch (err) { return serverError(res, err); }
};
