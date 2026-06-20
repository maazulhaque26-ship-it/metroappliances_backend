const Inventory             = require('../models/Inventory');
const InventoryTransaction  = require('../models/InventoryTransaction');
const StockReservation      = require('../models/StockReservation');
const { ok, paginated, fail, notFound, serverError } = require('../utils/response');
const mongoose = require('mongoose');

// ── GET /admin/inventory/dashboard ───────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const matchBase = { isDeleted: false };
    if (warehouseId) matchBase.warehouse = mongoose.Types.ObjectId(warehouseId);

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      totalSKUs, outOfStock, lowStock, damagedItems,
      totalValue, reservationCount, todayTxns,
      movementTrend,
    ] = await Promise.all([
      Inventory.countDocuments(matchBase),
      Inventory.countDocuments({ ...matchBase, availableQty: 0 }),
      Inventory.countDocuments({ ...matchBase, availableQty: { $gt: 0 }, $expr: { $lte: ['$availableQty', '$reorderLevel'] } }),
      Inventory.countDocuments({ ...matchBase, damagedQty: { $gt: 0 } }),
      Inventory.aggregate([
        { $match: matchBase },
        { $group: { _id: null, value: { $sum: { $multiply: ['$availableQty', '$averageCost'] } } } },
      ]),
      StockReservation.countDocuments({ ...matchBase, status: 'active' }),
      InventoryTransaction.countDocuments({
        ...(warehouseId ? { warehouse: mongoose.Types.ObjectId(warehouseId) } : {}),
        createdAt: { $gte: today },
      }),
      InventoryTransaction.aggregate([
        {
          $match: {
            ...(warehouseId ? { warehouse: mongoose.Types.ObjectId(warehouseId) } : {}),
            createdAt: { $gte: new Date(Date.now() - 7 * 86400000) },
          },
        },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return ok(res, {
      totalSKUs,
      outOfStock,
      lowStock,
      damagedItems,
      totalInventoryValue: totalValue[0]?.value || 0,
      activeReservations:  reservationCount,
      todayTransactions:   todayTxns,
      movementTrend,
    });
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory ──────────────────────────────────────────────────────
exports.getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, search, stockStatus } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;

    if (stockStatus === 'out_of_stock') filter.availableQty = 0;
    else if (stockStatus === 'low_stock')  filter.$expr = { $and: [{ $gt: ['$availableQty', 0] }, { $lte: ['$availableQty', '$reorderLevel'] }] };
    else if (stockStatus === 'in_stock')   filter.availableQty = { $gt: 0 };

    let query = Inventory.find(filter)
      .populate('product', 'name sku images price')
      .populate('warehouse', 'name code')
      .populate('zone', 'name code type')
      .populate('storageLocation', 'rack shelf bin barcode')
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (search) {
      const productIds = await require('../models/Product')
        .find({ $or: [{ name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }] })
        .distinct('_id');
      filter.product = { $in: productIds };
    }

    const [data, total] = await Promise.all([
      query.lean(),
      Inventory.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/:id ──────────────────────────────────────────────────
exports.getInventoryById = async (req, res) => {
  try {
    const inv = await Inventory.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product', 'name sku images price category')
      .populate('warehouse', 'name code city')
      .populate('zone', 'name code type')
      .populate('storageLocation', 'rack shelf bin barcode capacity occupied')
      .lean();
    if (!inv) return notFound(res, 'Inventory record');

    const [transactions, reservations] = await Promise.all([
      InventoryTransaction.find({ inventory: inv._id }).sort({ createdAt: -1 }).limit(20).lean(),
      StockReservation.find({ inventory: inv._id, status: 'active', isDeleted: false }).lean(),
    ]);

    return ok(res, { ...inv, recentTransactions: transactions, activeReservations: reservations });
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/:id/thresholds ───────────────────────────────────────
exports.updateThresholds = async (req, res) => {
  try {
    const inv = await Inventory.findOne({ _id: req.params.id, isDeleted: false });
    if (!inv) return notFound(res, 'Inventory record');

    const { safetyStock, reorderLevel, reorderQty } = req.body;
    if (safetyStock  !== undefined) inv.safetyStock  = Number(safetyStock);
    if (reorderLevel !== undefined) inv.reorderLevel = Number(reorderLevel);
    if (reorderQty   !== undefined) inv.reorderQty   = Number(reorderQty);
    await inv.save();

    return ok(res, inv, 'Thresholds updated');
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/low-stock ────────────────────────────────────────────
exports.getLowStock = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = {
      isDeleted: false,
      $expr: { $and: [{ $gt: ['$availableQty', 0] }, { $lte: ['$availableQty', '$reorderLevel'] }] },
    };
    if (warehouseId) filter.warehouse = warehouseId;

    const data = await Inventory.find(filter)
      .populate('product', 'name sku images')
      .populate('warehouse', 'name code')
      .sort({ availableQty: 1 })
      .limit(100)
      .lean();

    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/out-of-stock ─────────────────────────────────────────
exports.getOutOfStock = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = { isDeleted: false, availableQty: 0 };
    if (warehouseId) filter.warehouse = warehouseId;

    const data = await Inventory.find(filter)
      .populate('product', 'name sku images')
      .populate('warehouse', 'name code')
      .sort({ lastUpdated: -1 })
      .limit(100)
      .lean();

    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/valuation ────────────────────────────────────────────
exports.getValuation = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const match = { isDeleted: false };
    if (warehouseId) match.warehouse = mongoose.Types.ObjectId(warehouseId);

    const result = await Inventory.aggregate([
      { $match: match },
      {
        $group: {
          _id:             '$warehouse',
          totalQty:        { $sum: '$availableQty' },
          totalValue:      { $sum: { $multiply: ['$availableQty', '$averageCost'] } },
          damagedValue:    { $sum: { $multiply: ['$damagedQty',   '$averageCost'] } },
          reservedValue:   { $sum: { $multiply: ['$reservedQty',  '$averageCost'] } },
          skuCount:        { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'warehouses', localField: '_id', foreignField: '_id', as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmpty: true } },
    ]);

    return ok(res, result);
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse portal: inventory lookup ────────────────────────────────────────
exports.warehouseGetInventory = async (req, res) => {
  try {
    const whId = req.warehouseUser?.warehouse;
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { warehouse: whId, isDeleted: false };

    const [data, total] = await Promise.all([
      Inventory.find(filter)
        .populate('product', 'name sku images')
        .populate('zone', 'name code')
        .populate('storageLocation', 'rack shelf bin barcode')
        .sort({ lastUpdated: -1 })
        .skip(skip).limit(Number(limit))
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};
