const StorageLocation = require('../models/StorageLocation');
const WarehouseZone   = require('../models/WarehouseZone');
const Warehouse       = require('../models/Warehouse');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ── List locations ────────────────────────────────────────────────────────────
exports.getLocations = async (req, res) => {
  try {
    const { warehouseId, zoneId, status, rack, page = 1, limit = 50, search } = req.query;
    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (zoneId)      filter.zone      = zoneId;
    if (status)      filter.status    = status;
    if (rack)        filter.rack      = rack.toUpperCase();
    if (search) {
      filter.$or = [
        { rack:    new RegExp(search, 'i') },
        { shelf:   new RegExp(search, 'i') },
        { bin:     new RegExp(search, 'i') },
        { barcode: new RegExp(search, 'i') },
      ];
    }

    const [data, total] = await Promise.all([
      StorageLocation.find(filter)
        .populate('warehouse', 'code name')
        .populate('zone', 'code name type')
        .sort({ rack: 1, shelf: 1, bin: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      StorageLocation.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Create location ───────────────────────────────────────────────────────────
exports.createLocation = async (req, res) => {
  try {
    const { warehouse, zone, rack, shelf, bin, barcode, capacity, status } = req.body;
    if (!warehouse || !zone || !rack || !shelf) {
      return fail(res, 'warehouse, zone, rack, shelf are required');
    }

    const [wh, z] = await Promise.all([
      Warehouse.findOne({ _id: warehouse, isDeleted: false }),
      WarehouseZone.findOne({ _id: zone, warehouse, isDeleted: false }),
    ]);
    if (!wh) return notFound(res, 'Warehouse');
    if (!z)  return notFound(res, 'Zone (or zone does not belong to warehouse)');

    const location = await StorageLocation.create({
      warehouse, zone,
      rack: rack.toUpperCase().trim(),
      shelf: shelf.trim(),
      bin: bin?.trim(),
      barcode: barcode?.trim() || undefined,
      capacity: capacity || 1,
      status: status || 'available',
    });

    return created(res, location, 'Location created');
  } catch (err) { return serverError(res, err); }
};

// ── Bulk create locations ─────────────────────────────────────────────────────
exports.bulkCreateLocations = async (req, res) => {
  try {
    const { warehouse, zone, rack, shelves = [], capacity = 1, barcodePrefix } = req.body;
    if (!warehouse || !zone || !rack || !shelves.length) {
      return fail(res, 'warehouse, zone, rack, shelves[] are required');
    }

    const docs = shelves.map((shelf, i) => ({
      warehouse, zone,
      rack: rack.toUpperCase().trim(),
      shelf: String(shelf).trim(),
      capacity,
      barcode: barcodePrefix ? `${barcodePrefix}-${rack.toUpperCase()}-${shelf}-${Date.now()}-${i}` : undefined,
      status: 'available',
    }));

    const locations = await StorageLocation.insertMany(docs, { ordered: false });
    return created(res, locations, `${locations.length} locations created`);
  } catch (err) { return serverError(res, err); }
};

// ── Get location by ID ────────────────────────────────────────────────────────
exports.getLocationById = async (req, res) => {
  try {
    const location = await StorageLocation.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouse', 'code name city')
      .populate('zone', 'code name type');
    if (!location) return notFound(res, 'Location');
    return ok(res, location);
  } catch (err) { return serverError(res, err); }
};

// ── Update location ───────────────────────────────────────────────────────────
exports.updateLocation = async (req, res) => {
  try {
    const allowed = ['shelf', 'bin', 'barcode', 'qrCode', 'capacity', 'occupied', 'status', 'isActive'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const location = await StorageLocation.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).populate('warehouse', 'code name').populate('zone', 'code name type');

    if (!location) return notFound(res, 'Location');
    return ok(res, location, 'Location updated');
  } catch (err) { return serverError(res, err); }
};

// ── Soft delete location ──────────────────────────────────────────────────────
exports.deleteLocation = async (req, res) => {
  try {
    const location = await StorageLocation.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!location) return notFound(res, 'Location');
    return noContent(res, 'Location deleted');
  } catch (err) { return serverError(res, err); }
};
