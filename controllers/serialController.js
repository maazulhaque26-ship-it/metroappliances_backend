const SerialNumber = require('../models/SerialNumber');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── GET /admin/inventory/serials ──────────────────────────────────────────────
exports.getSerials = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, productId, status, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (productId)   filter.product   = productId;
    if (status)      filter.status    = status;
    if (search)      filter.serialNumber = new RegExp(search, 'i');

    const [data, total] = await Promise.all([
      SerialNumber.find(filter)
        .populate('product', 'name sku')
        .populate('warehouse', 'name code')
        .populate('batch', 'batchNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      SerialNumber.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/serials/:id ─────────────────────────────────────────
exports.getSerialById = async (req, res) => {
  try {
    const serial = await SerialNumber.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product', 'name sku images')
      .populate('warehouse', 'name code')
      .populate('zone', 'name code')
      .populate('storageLocation', 'rack shelf bin barcode')
      .populate('grn', 'grnNumber status')
      .populate('batch', 'batchNumber expiryDate')
      .lean();
    if (!serial) return notFound(res, 'Serial number');
    return ok(res, serial);
  } catch (err) { return serverError(res, err); }
};

// ── POST /admin/inventory/serials ─────────────────────────────────────────────
exports.createSerial = async (req, res) => {
  try {
    const { serialNumber, product, warehouse, zone, storageLocation, imei, warrantyExpiry } = req.body;
    if (!serialNumber || !product || !warehouse) {
      return fail(res, 'serialNumber, product and warehouse are required');
    }

    const existing = await SerialNumber.findOne({ serialNumber });
    if (existing) return fail(res, 'Serial number already exists');

    const serial = await SerialNumber.create({ serialNumber, product, warehouse, zone, storageLocation, imei, warrantyExpiry });
    return created(res, serial, 'Serial number created');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/serials/:id ─────────────────────────────────────────
exports.updateSerial = async (req, res) => {
  try {
    const serial = await SerialNumber.findOne({ _id: req.params.id, isDeleted: false });
    if (!serial) return notFound(res, 'Serial number');

    const allowed = ['status', 'soldTo', 'soldAt', 'reservedFor', 'reservedAt', 'warrantyExpiry', 'imei', 'notes', 'warehouse', 'zone', 'storageLocation'];
    allowed.forEach(f => { if (req.body[f] !== undefined) serial[f] = req.body[f]; });
    await serial.save();

    return ok(res, serial, 'Serial number updated');
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/serials/by-product ───────────────────────────────────
exports.getSerialsByProduct = async (req, res) => {
  try {
    const { productId, warehouseId, status } = req.query;
    if (!productId) return fail(res, 'productId is required');

    const filter = { product: productId, isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (status)      filter.status    = status;

    const data = await SerialNumber.find(filter)
      .populate('warehouse', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    const byStatus = { in_stock: 0, reserved: 0, sold: 0, returned: 0, damaged: 0, lost: 0 };
    data.forEach(s => { if (byStatus[s.status] !== undefined) byStatus[s.status]++; });

    return ok(res, { items: data, summary: byStatus });
  } catch (err) { return serverError(res, err); }
};
