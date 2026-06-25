const InventoryTransaction = require('../models/InventoryTransaction');
const { ok, paginated, notFound, serverError } = require('../utils/response');
const mongoose = require('mongoose');

// ── GET /admin/inventory/transactions ─────────────────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, type, productId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse  = warehouseId;
    if (type)        filter.type       = type;
    if (productId)   filter.product    = productId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      InventoryTransaction.find(filter)
        .populate('product', 'name sku')
        .populate('warehouse', 'name code')
        .populate('zone', 'name code')
        .populate('storageLocation', 'rack shelf bin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InventoryTransaction.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/transactions/:id ─────────────────────────────────────
exports.getTransactionById = async (req, res) => {
  try {
    const txn = await InventoryTransaction.findById(req.params.id)
      .populate('product', 'name sku images')
      .populate('warehouse', 'name code')
      .populate('zone', 'name code type')
      .populate('storageLocation', 'rack shelf bin barcode')
      .lean();
    if (!txn) return notFound(res, 'Transaction');
    return ok(res, txn);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/stock-ledger ─────────────────────────────────────────
exports.getStockLedger = async (req, res) => {
  try {
    const { productId, warehouseId, startDate, endDate } = req.query;
    if (!productId || !warehouseId) {
      return require('../utils/response').fail(res, 'productId and warehouseId are required');
    }

    const filter = { product: productId, warehouse: warehouseId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const txns = await InventoryTransaction.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    // Build running balance ledger
    const ledger = txns.map((t, i) => ({
      ...t,
      runningBalance: t.newQty,
    }));

    return ok(res, ledger);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/movement-report ──────────────────────────────────────
exports.getMovementReport = async (req, res) => {
  try {
    const { warehouseId, startDate, endDate } = req.query;

    const matchStage = { isDeleted: false };
    if (warehouseId) matchStage.warehouse = mongoose.Types.ObjectId(warehouseId);
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate)   matchStage.createdAt.$lte = new Date(endDate);
    }

    const result = await InventoryTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count:       { $sum: 1 },
          totalUnitsIn:  { $sum: { $cond: [{ $gt: ['$quantity', 0] }, '$quantity', 0] } },
          totalUnitsOut: { $sum: { $cond: [{ $lt: ['$quantity', 0] }, { $abs: '$quantity' }, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return ok(res, result);
  } catch (err) { return serverError(res, err); }
};
