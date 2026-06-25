const StockReservation = require('../models/StockReservation');
const Inventory        = require('../models/Inventory');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');
const { adjustInventory } = require('../utils/inventoryHelpers');

// ── GET /admin/inventory/reservations ────────────────────────────────────────
exports.getReservations = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, status, referenceType } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId)    filter.warehouse     = warehouseId;
    if (status)         filter.status        = status;
    if (referenceType)  filter.referenceType = referenceType;

    const [data, total] = await Promise.all([
      StockReservation.find(filter)
        .populate('product', 'name sku images')
        .populate('warehouse', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      StockReservation.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── POST /admin/inventory/reservations ───────────────────────────────────────
exports.createReservation = async (req, res) => {
  try {
    const { product, warehouse, quantity, referenceType, referenceId, referenceNumber, expiresAt, notes } = req.body;
    if (!product || !warehouse || !quantity || !referenceType) {
      return fail(res, 'product, warehouse, quantity and referenceType are required');
    }

    const inv = await Inventory.findOne({ product, warehouse, isDeleted: false });
    if (!inv) return fail(res, 'No inventory record found for this product+warehouse');
    if (inv.availableQty < quantity) {
      return fail(res, `Insufficient stock. Available: ${inv.availableQty}, Requested: ${quantity}`);
    }

    // Move qty from available to reserved
    await adjustInventory({
      productId: product, warehouse, quantity: -quantity,
      type: 'reservation', field: 'availableQty',
      referenceType, referenceId, referenceNumber,
      performedById: req.user?._id, performedByName: req.user?.name || '', performedByType: 'admin',
      notes: notes || `Reserved for ${referenceType} ${referenceNumber || ''}`,
    });

    inv.reservedQty = (inv.reservedQty || 0) + Number(quantity);
    await inv.save();

    const reservation = await StockReservation.create({
      product, inventory: inv._id, warehouse, quantity,
      referenceType, referenceId, referenceNumber,
      status: 'active',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      reservedBy:     req.user?._id,
      reservedByName: req.user?.name || '',
      notes,
    });

    return created(res, reservation, 'Stock reserved');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/reservations/:id/release ────────────────────────────
exports.releaseReservation = async (req, res) => {
  try {
    const rsv = await StockReservation.findOne({ _id: req.params.id, isDeleted: false });
    if (!rsv) return notFound(res, 'Reservation');
    if (rsv.status !== 'active') return fail(res, `Cannot release a reservation in status "${rsv.status}"`);

    // Return qty to available
    await adjustInventory({
      productId: rsv.product, warehouse: rsv.warehouse, quantity: rsv.quantity,
      type: 'release', field: 'availableQty',
      referenceType: 'Reservation', referenceId: rsv._id,
      performedById: req.user?._id, performedByName: req.user?.name || '', performedByType: 'admin',
      notes: 'Reservation released',
    });

    // Decrement reservedQty on Inventory
    await Inventory.findByIdAndUpdate(rsv.inventory, { $inc: { reservedQty: -rsv.quantity } });

    rsv.status      = 'released';
    rsv.releasedAt  = new Date();
    await rsv.save();

    return ok(res, rsv, 'Reservation released');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/reservations/:id/fulfill ────────────────────────────
exports.fulfillReservation = async (req, res) => {
  try {
    const rsv = await StockReservation.findOne({ _id: req.params.id, isDeleted: false });
    if (!rsv) return notFound(res, 'Reservation');
    if (rsv.status !== 'active') return fail(res, `Cannot fulfill a reservation in status "${rsv.status}"`);

    // Decrement reservedQty (stock was already deducted from available on reservation)
    await Inventory.findByIdAndUpdate(rsv.inventory, { $inc: { reservedQty: -rsv.quantity } });

    // Record sale transaction
    await adjustInventory({
      productId: rsv.product, warehouse: rsv.warehouse, quantity: -rsv.quantity,
      type: 'sale', field: 'reservedQty',
      referenceType: rsv.referenceType, referenceId: rsv.referenceId, referenceNumber: rsv.referenceNumber,
      performedById: req.user?._id, performedByName: req.user?.name || '', performedByType: 'admin',
      notes: 'Reservation fulfilled',
    });

    rsv.status      = 'fulfilled';
    rsv.fulfilledAt = new Date();
    await rsv.save();

    return ok(res, rsv, 'Reservation fulfilled');
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/reservations/dashboard ───────────────────────────────
exports.getReservationDashboard = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const matchBase = { isDeleted: false };
    if (warehouseId) matchBase.warehouse = require('mongoose').Types.ObjectId(warehouseId);

    const now = new Date();

    const [byStatus, expiringSoon, topProducts] = await Promise.all([
      StockReservation.aggregate([
        { $match: matchBase },
        { $group: { _id: '$status', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
      ]),
      StockReservation.find({
        ...matchBase, status: 'active',
        expiresAt: { $lte: new Date(now.getTime() + 24 * 3600000), $gte: now },
      }).populate('product', 'name sku').limit(10).lean(),
      StockReservation.aggregate([
        { $match: { ...matchBase, status: 'active' } },
        { $group: { _id: '$product', totalReserved: { $sum: '$quantity' } } },
        { $sort: { totalReserved: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmpty: true } },
      ]),
    ]);

    const stats = {};
    byStatus.forEach(b => { stats[b._id] = { count: b.count, totalQty: b.totalQty }; });

    return ok(res, { stats, expiringSoon, topProducts });
  } catch (err) { return serverError(res, err); }
};
