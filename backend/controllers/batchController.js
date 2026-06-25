const Batch = require('../models/Batch');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── GET /admin/inventory/batches ──────────────────────────────────────────────
exports.getBatches = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, productId, status, expiringSoon } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (productId)   filter.product   = productId;
    if (status)      filter.status    = status;
    if (expiringSoon === 'true') {
      const soon = new Date(Date.now() + 30 * 86400000); // 30 days
      filter.expiryDate = { $lte: soon, $gte: new Date() };
      filter.status     = { $in: ['active', 'quarantine'] };
    }

    const [data, total] = await Promise.all([
      Batch.find(filter)
        .populate('product', 'name sku images')
        .populate('warehouse', 'name code')
        .populate('zone', 'name code')
        .populate('storageLocation', 'rack shelf bin')
        .sort({ expiryDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Batch.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/batches/:id ─────────────────────────────────────────
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product', 'name sku images')
      .populate('warehouse', 'name code')
      .populate('zone', 'name code type')
      .populate('storageLocation', 'rack shelf bin barcode')
      .populate('grn', 'grnNumber status')
      .lean();
    if (!batch) return notFound(res, 'Batch');
    return ok(res, batch);
  } catch (err) { return serverError(res, err); }
};

// ── POST /admin/inventory/batches ─────────────────────────────────────────────
exports.createBatch = async (req, res) => {
  try {
    const { batchNumber, product, warehouse, zone, storageLocation,
            supplier, manufacturingDate, expiryDate, initialQty, costPerUnit } = req.body;

    if (!batchNumber || !product || !warehouse || !initialQty) {
      return fail(res, 'batchNumber, product, warehouse, initialQty are required');
    }

    const exists = await Batch.findOne({ batchNumber, product, warehouse });
    if (exists) return fail(res, 'Batch number already exists for this product+warehouse');

    const batch = await Batch.create({
      batchNumber, product, warehouse, zone, storageLocation,
      supplier, manufacturingDate, expiryDate,
      initialQty: Number(initialQty),
      availableQty: Number(initialQty),
      costPerUnit: Number(costPerUnit) || 0,
    });

    return created(res, batch, 'Batch created');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/batches/:id ─────────────────────────────────────────
exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, isDeleted: false });
    if (!batch) return notFound(res, 'Batch');

    const allowed = ['supplier', 'manufacturingDate', 'expiryDate', 'status', 'costPerUnit'];
    allowed.forEach(f => { if (req.body[f] !== undefined) batch[f] = req.body[f]; });
    await batch.save();

    return ok(res, batch, 'Batch updated');
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/batches/expiring ────────────────────────────────────
exports.getExpiringBatches = async (req, res) => {
  try {
    const { days = 30, warehouseId } = req.query;
    const soon = new Date(Date.now() + Number(days) * 86400000);

    const filter = {
      isDeleted:    false,
      status:       { $in: ['active', 'quarantine'] },
      availableQty: { $gt: 0 },
      expiryDate:   { $lte: soon },
    };
    if (warehouseId) filter.warehouse = warehouseId;

    const data = await Batch.find(filter)
      .populate('product', 'name sku images')
      .populate('warehouse', 'name code')
      .sort({ expiryDate: 1 })
      .lean();

    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};
