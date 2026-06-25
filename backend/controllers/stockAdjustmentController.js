const StockAdjustment = require('../models/StockAdjustment');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');
const { adjustInventory, generateAdjNumber } = require('../utils/inventoryHelpers');

// ── GET /admin/inventory/adjustments ─────────────────────────────────────────
exports.getAdjustments = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (status)      filter.status    = status;

    const [data, total] = await Promise.all([
      StockAdjustment.find(filter)
        .populate('warehouse', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      StockAdjustment.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/adjustments/:id ─────────────────────────────────────
exports.getAdjustmentById = async (req, res) => {
  try {
    const adj = await StockAdjustment.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('items.storageLocation', 'rack shelf bin')
      .lean();
    if (!adj) return notFound(res, 'Stock Adjustment');
    return ok(res, adj);
  } catch (err) { return serverError(res, err); }
};

// ── POST /admin/inventory/adjustments ────────────────────────────────────────
exports.createAdjustment = async (req, res) => {
  try {
    const { warehouse, items, notes } = req.body;
    if (!warehouse || !items?.length) {
      return fail(res, 'warehouse and items are required');
    }

    const adjNumber = await generateAdjNumber();
    const adj = await StockAdjustment.create({
      adjustmentNumber: adjNumber,
      warehouse,
      items,
      notes,
      status:            'pending',
      requestedBy:       req.user?._id || req.warehouseUser?._id,
      requestedByName:   req.user?.name || req.warehouseUser?.name || '',
      requestedByType:   req.warehouseUser ? 'warehouse_user' : 'admin',
    });

    return created(res, adj, 'Adjustment request created — pending approval');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/adjustments/:id/approve ─────────────────────────────
exports.approveAdjustment = async (req, res) => {
  try {
    const adj = await StockAdjustment.findOne({ _id: req.params.id, isDeleted: false });
    if (!adj) return notFound(res, 'Stock Adjustment');
    if (adj.status !== 'pending') return fail(res, `Cannot approve adjustment in status "${adj.status}"`);

    // Apply each item
    for (const item of adj.items) {
      if (!item.product || item.adjustedQty === 0) continue;

      const type  = item.adjustedQty > 0 ? 'adjustment' : 'damage';
      const field = item.adjustedQty < 0 && ['damage', 'lost', 'expired'].includes(item.reason)
        ? 'damagedQty'
        : 'availableQty';

      await adjustInventory({
        productId:       item.product,
        warehouse:       adj.warehouse,
        storageLocation: item.storageLocation || null,
        quantity:        item.adjustedQty,
        type:            'adjustment',
        field,
        referenceType:   'Adjustment',
        referenceId:     adj._id,
        referenceNumber: adj.adjustmentNumber,
        performedById:   req.user?._id,
        performedByName: req.user?.name || '',
        performedByType: 'admin',
        notes:           `Adjustment: ${item.reason || ''} — ${item.notes || ''}`,
      });
    }

    adj.status         = 'applied';
    adj.approvedBy     = req.user?._id;
    adj.approvedByName = req.user?.name || '';
    adj.approvedAt     = new Date();
    adj.appliedAt      = new Date();
    await adj.save();

    return ok(res, adj, 'Adjustment approved and applied');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/adjustments/:id/reject ───────────────────────────────
exports.rejectAdjustment = async (req, res) => {
  try {
    const adj = await StockAdjustment.findOne({ _id: req.params.id, isDeleted: false });
    if (!adj) return notFound(res, 'Stock Adjustment');
    if (adj.status !== 'pending') return fail(res, `Cannot reject adjustment in status "${adj.status}"`);

    adj.status          = 'rejected';
    adj.approvedBy      = req.user?._id;
    adj.approvedByName  = req.user?.name || '';
    adj.approvedAt      = new Date();
    adj.rejectionReason = req.body.reason || 'No reason provided';
    await adj.save();

    return ok(res, adj, 'Adjustment rejected');
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: submit adjustment ──────────────────────────────────────────────
exports.warehouseCreateAdjustment = async (req, res) => {
  try {
    const { items, notes } = req.body;
    const warehouse = req.warehouseUser?.warehouse;
    if (!items?.length) return fail(res, 'items are required');

    const adjNumber = await generateAdjNumber();
    const adj = await StockAdjustment.create({
      adjustmentNumber: adjNumber,
      warehouse,
      items,
      notes,
      status:           'pending',
      requestedBy:      req.warehouseUser?._id,
      requestedByName:  req.warehouseUser?.name || '',
      requestedByType:  'warehouse_user',
    });

    return created(res, adj, 'Adjustment submitted for admin approval');
  } catch (err) { return serverError(res, err); }
};
