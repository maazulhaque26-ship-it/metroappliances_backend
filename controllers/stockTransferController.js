const StockTransfer = require('../models/StockTransfer');
const Inventory     = require('../models/Inventory');
const { paginateQuery, respOk, respErr } = require('../utils/logisticsHelpers');

// ── Admin: List transfers ─────────────────────────────────────────────────────
exports.getTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, fromWarehouse, toWarehouse, search } = req.query;
    const filter = { isDeleted: false };
    if (status)        filter.status        = status;
    if (fromWarehouse) filter.fromWarehouse = fromWarehouse;
    if (toWarehouse)   filter.toWarehouse   = toWarehouse;
    if (search)        filter.$or = [
      { transferNumber:     { $regex: search, $options: 'i' } },
      { fromWarehouseName:  { $regex: search, $options: 'i' } },
      { toWarehouseName:    { $regex: search, $options: 'i' } },
    ];
    const result = await paginateQuery(StockTransfer, filter, {
      page: +page, limit: +limit,
      populate: ['fromWarehouse','toWarehouse'],
    });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages } });
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Create transfer ────────────────────────────────────────────────────
exports.createTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.create({
      ...req.body,
      requestedBy:     req.user._id,
      requestedByName: req.user.name,
    });
    respOk(res, transfer, 'Transfer created', 201);
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Get transfer by ID ─────────────────────────────────────────────────
exports.getTransferById = async (req, res) => {
  try {
    const transfer = await StockTransfer.findOne({ _id: req.params.id, isDeleted: false })
      .populate('fromWarehouse toWarehouse requestedBy approvedBy');
    if (!transfer) return respErr(res, 'Not found', 404);
    respOk(res, transfer);
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Submit transfer for approval ───────────────────────────────────────
exports.submitTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findOne({ _id: req.params.id, isDeleted: false });
    if (!transfer) return respErr(res, 'Not found', 404);
    if (transfer.status !== 'draft') return respErr(res, 'Can only submit draft transfers');
    transfer.status = 'submitted';
    await transfer.save();
    respOk(res, transfer, 'Submitted for approval');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Approve transfer ───────────────────────────────────────────────────
exports.approveTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findOne({ _id: req.params.id, isDeleted: false });
    if (!transfer) return respErr(res, 'Not found', 404);
    if (transfer.status !== 'submitted') return respErr(res, 'Transfer must be submitted first');
    transfer.status         = 'approved';
    transfer.approvedBy     = req.user._id;
    transfer.approvedByName = req.user.name;
    transfer.approvedAt     = new Date();
    await transfer.save();
    respOk(res, transfer, 'Transfer approved');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Reject transfer ────────────────────────────────────────────────────
exports.rejectTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findOne({ _id: req.params.id, isDeleted: false });
    if (!transfer) return respErr(res, 'Not found', 404);
    transfer.status = 'rejected';
    transfer.notes  = req.body.reason || transfer.notes;
    await transfer.save();
    respOk(res, transfer, 'Transfer rejected');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Cancel transfer ────────────────────────────────────────────────────
exports.cancelTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findOne({ _id: req.params.id, isDeleted: false });
    if (!transfer) return respErr(res, 'Not found', 404);
    if (['completed','cancelled'].includes(transfer.status)) return respErr(res, 'Cannot cancel at this stage');
    transfer.status = 'cancelled';
    await transfer.save();
    respOk(res, transfer, 'Transfer cancelled');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Warehouse portal: Get pending transfers ───────────────────────────────────
exports.warehouseGetTransfers = async (req, res) => {
  try {
    const { status } = req.query;
    const warehouseId = req.warehouseUser.warehouse;
    const filter = {
      $or: [{ fromWarehouse: warehouseId }, { toWarehouse: warehouseId }],
      isDeleted: false,
    };
    if (status) filter.status = status;
    const transfers = await StockTransfer.find(filter)
      .populate('fromWarehouse toWarehouse').sort({ createdAt: -1 }).limit(50).lean();
    respOk(res, transfers);
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Warehouse portal: Ship transfer (source warehouse) ───────────────────────
exports.warehouseShipTransfer = async (req, res) => {
  try {
    const { vehicle, driverName } = req.body;
    const warehouseId = req.warehouseUser.warehouse;
    const transfer = await StockTransfer.findOne({ _id: req.params.id, fromWarehouse: warehouseId, isDeleted: false });
    if (!transfer) return respErr(res, 'Not found', 404);
    if (transfer.status !== 'approved') return respErr(res, 'Transfer must be approved first');

    transfer.status    = 'in_transit';
    transfer.shippedBy = req.warehouseUser._id;
    transfer.shippedAt = new Date();
    if (vehicle)    transfer.vehicle    = vehicle;
    if (driverName) transfer.driverName = driverName;
    // Update shipped quantities from items
    transfer.items.forEach(item => { item.quantityShipped = item.quantityRequested; item.status = 'shipped'; });
    await transfer.save();
    respOk(res, transfer, 'Transfer shipped');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Warehouse portal: Receive transfer (destination warehouse) ───────────────
exports.warehouseReceiveTransfer = async (req, res) => {
  try {
    const { receivedItems } = req.body; // [{itemIndex, quantityReceived}]
    const warehouseId = req.warehouseUser.warehouse;
    const transfer = await StockTransfer.findOne({ _id: req.params.id, toWarehouse: warehouseId, isDeleted: false });
    if (!transfer) return respErr(res, 'Not found', 404);
    if (transfer.status !== 'in_transit') return respErr(res, 'Transfer must be in transit');

    receivedItems?.forEach(({ itemIndex, quantityReceived }) => {
      if (transfer.items[itemIndex]) {
        transfer.items[itemIndex].quantityReceived = quantityReceived;
        transfer.items[itemIndex].status = quantityReceived >= transfer.items[itemIndex].quantityShipped ? 'received' : 'discrepancy';
      }
    });
    transfer.status      = 'received';
    transfer.receivedBy  = req.warehouseUser._id;
    transfer.receivedAt  = new Date();
    await transfer.save();
    respOk(res, transfer, 'Transfer received');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Complete transfer ──────────────────────────────────────────────────
exports.completeTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findOne({ _id: req.params.id, isDeleted: false });
    if (!transfer) return respErr(res, 'Not found', 404);
    if (transfer.status !== 'received') return respErr(res, 'Transfer must be received first');
    transfer.status      = 'completed';
    transfer.completedAt = new Date();
    await transfer.save();
    respOk(res, transfer, 'Transfer completed');
  } catch (err) { respErr(res, err.message, 400); }
};
