const Warehouse         = require('../models/Warehouse');
const WarehouseZone     = require('../models/WarehouseZone');
const StorageLocation   = require('../models/StorageLocation');
const WarehouseUser     = require('../models/WarehouseUser');
const WarehouseSettings = require('../models/WarehouseSettings');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

// ── List warehouses ───────────────────────────────────────────────────────────
exports.getWarehouses = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, city } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (city)   filter.city   = new RegExp(city, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
      ];
    }

    const [data, total] = await Promise.all([
      Warehouse.find(filter)
        .populate('manager', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Warehouse.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Create warehouse (auto-creates WarehouseSettings) ─────────────────────────
exports.createWarehouse = async (req, res) => {
  try {
    const { code, name, address, city, state, country, pincode, gst, phone, email,
            totalCapacity, status, timezone, notes } = req.body;

    if (!code || !name || !address || !city || !state) {
      return fail(res, 'code, name, address, city, state are required');
    }

    const exists = await Warehouse.findOne({ code: code.toUpperCase().trim(), isDeleted: false });
    if (exists) return fail(res, `Warehouse code ${code.toUpperCase()} already exists`);

    const warehouse = await Warehouse.create({
      code: code.toUpperCase().trim(), name, address, city, state,
      country: country || 'India', pincode, gst, phone, email,
      totalCapacity: totalCapacity || 0, status: status || 'active',
      timezone: timezone || 'Asia/Kolkata', notes,
    });

    await WarehouseSettings.create({ warehouse: warehouse._id });

    return created(res, warehouse, 'Warehouse created');
  } catch (err) { return serverError(res, err); }
};

// ── Get single warehouse ──────────────────────────────────────────────────────
exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ _id: req.params.id, isDeleted: false })
      .populate('manager', 'name email role phone');
    if (!warehouse) return notFound(res, 'Warehouse');

    const [zones, totalLocations, activeUsers] = await Promise.all([
      WarehouseZone.find({ warehouse: warehouse._id, isDeleted: false }).lean(),
      StorageLocation.countDocuments({ warehouse: warehouse._id, isDeleted: false }),
      WarehouseUser.countDocuments({ warehouse: warehouse._id, isDeleted: false, status: 'active' }),
    ]);

    return ok(res, { warehouse, zones, totalLocations, activeUsers });
  } catch (err) { return serverError(res, err); }
};

// ── Update warehouse ──────────────────────────────────────────────────────────
exports.updateWarehouse = async (req, res) => {
  try {
    const allowed = ['name', 'address', 'city', 'state', 'country', 'pincode', 'gst',
                     'phone', 'email', 'manager', 'totalCapacity', 'status', 'timezone', 'notes'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).populate('manager', 'name email role');

    if (!warehouse) return notFound(res, 'Warehouse');
    return ok(res, warehouse, 'Warehouse updated');
  } catch (err) { return serverError(res, err); }
};

// ── Soft delete warehouse ─────────────────────────────────────────────────────
exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, status: 'inactive' },
      { new: true }
    );
    if (!warehouse) return notFound(res, 'Warehouse');
    return noContent(res, 'Warehouse deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Dashboard stats ───────────────────────────────────────────────────────────
exports.getWarehouseDashboard = async (req, res) => {
  try {
    const [
      total, active, maintenance,
      totalZones, totalLocations, availableLocations, occupiedLocations,
      totalUsers, activeUsers,
    ] = await Promise.all([
      Warehouse.countDocuments({ isDeleted: false }),
      Warehouse.countDocuments({ isDeleted: false, status: 'active' }),
      Warehouse.countDocuments({ isDeleted: false, status: 'maintenance' }),
      WarehouseZone.countDocuments({ isDeleted: false }),
      StorageLocation.countDocuments({ isDeleted: false }),
      StorageLocation.countDocuments({ isDeleted: false, status: 'available' }),
      StorageLocation.countDocuments({ isDeleted: false, status: 'occupied' }),
      WarehouseUser.countDocuments({ isDeleted: false }),
      WarehouseUser.countDocuments({ isDeleted: false, status: 'active' }),
    ]);

    const warehouses = await Warehouse.find({ isDeleted: false })
      .select('code name city status totalCapacity usedCapacity')
      .sort({ createdAt: -1 })
      .lean();

    const capacityUsedPct = totalLocations > 0
      ? Math.round((occupiedLocations / totalLocations) * 100)
      : 0;

    const recentWarehouses = warehouses.slice(0, 5);

    const zoneTypeBreakdown = await WarehouseZone.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return ok(res, {
      summary: { total, active, maintenance, totalZones, totalLocations, availableLocations, occupiedLocations, capacityUsedPct, totalUsers, activeUsers },
      warehouses,
      recentWarehouses,
      zoneTypeBreakdown,
    });
  } catch (err) { return serverError(res, err); }
};
