const GRN         = require('../models/GRN');
const Batch       = require('../models/Batch');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');
const { adjustInventory, generateGRNNumber } = require('../utils/inventoryHelpers');

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcTotals = (items) => {
  let totalItems    = 0;
  let totalAccepted = 0;
  let totalRejected = 0;
  let totalDamaged  = 0;
  let totalValue    = 0;
  for (const it of items) {
    totalItems    += Number(it.receivedQty) || 0;
    totalAccepted += Number(it.acceptedQty) || 0;
    totalRejected += Number(it.rejectedQty) || 0;
    totalDamaged  += Number(it.damageQty)   || 0;
    totalValue    += (Number(it.acceptedQty) || 0) * (Number(it.unitCost) || 0);
  }
  return { totalItems, totalAccepted, totalRejected, totalDamaged, totalValue };
};

// ── GET /admin/grn ────────────────────────────────────────────────────────────
exports.getGRNs = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, status, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (status)      filter.status    = status;
    if (search)      filter.grnNumber = new RegExp(search, 'i');

    const [data, total] = await Promise.all([
      GRN.find(filter)
        .populate('warehouse', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      GRN.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── POST /admin/grn ───────────────────────────────────────────────────────────
exports.createGRN = async (req, res) => {
  try {
    const { warehouse, supplier, supplierPhone, supplierInvoice, purchaseOrder, items = [], remarks } = req.body;
    if (!warehouse) return fail(res, 'Warehouse is required');

    const grnNumber = await generateGRNNumber();
    const grn = await GRN.create({
      grnNumber, warehouse, supplier, supplierPhone,
      supplierInvoice, purchaseOrder, items, remarks,
      status: 'draft',
      createdBy:     req.user?._id,
      createdByName: req.user?.name || '',
      ...calcTotals(items),
    });

    return created(res, grn, 'GRN created');
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/grn/:id ────────────────────────────────────────────────────────
exports.getGRNById = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouse', 'name code city')
      .populate('items.product', 'name sku images')
      .populate('items.zone', 'name code type')
      .populate('items.storageLocation', 'rack shelf bin barcode')
      .lean();
    if (!grn) return notFound(res, 'GRN');
    return ok(res, grn);
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/grn/:id ────────────────────────────────────────────────────────
exports.updateGRN = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, isDeleted: false });
    if (!grn) return notFound(res, 'GRN');
    if (!['draft', 'pending'].includes(grn.status)) {
      return fail(res, `Cannot edit GRN in status "${grn.status}"`);
    }

    const allowed = ['supplier', 'supplierPhone', 'supplierInvoice', 'purchaseOrder', 'items', 'remarks'];
    allowed.forEach(f => { if (req.body[f] !== undefined) grn[f] = req.body[f]; });

    if (req.body.items) Object.assign(grn, calcTotals(req.body.items));
    await grn.save();
    return ok(res, grn, 'GRN updated');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/grn/:id/submit ─────────────────────────────────────────────────
exports.submitGRN = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, isDeleted: false });
    if (!grn) return notFound(res, 'GRN');
    if (grn.status !== 'draft') return fail(res, 'Only draft GRNs can be submitted');
    if (!grn.items.length) return fail(res, 'GRN must have at least one item');

    grn.status = 'pending';
    await grn.save();
    return ok(res, grn, 'GRN submitted for receiving');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/grn/:id/start-receiving ───────────────────────────────────────
exports.startReceiving = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, isDeleted: false });
    if (!grn) return notFound(res, 'GRN');
    if (grn.status !== 'pending') return fail(res, 'GRN must be in pending status to start receiving');

    grn.status     = 'receiving';
    grn.receivedAt = new Date();
    if (req.body.receivedByName) { grn.receivedByName = req.body.receivedByName; grn.receivedBy = req.body.receivedById; }
    await grn.save();
    return ok(res, grn, 'Receiving started');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/grn/:id/quality-check ─────────────────────────────────────────
exports.qualityCheck = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, isDeleted: false });
    if (!grn) return notFound(res, 'GRN');
    if (grn.status !== 'receiving') return fail(res, 'GRN must be in receiving status');

    const { items } = req.body;
    if (items && Array.isArray(items)) {
      grn.items = items;
      Object.assign(grn, calcTotals(items));
    }
    grn.status = 'quality_check';
    if (req.body.verifiedByName) { grn.verifiedByName = req.body.verifiedByName; grn.verifiedBy = req.body.verifiedById; }
    await grn.save();
    return ok(res, grn, 'Quality check recorded');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/grn/:id/complete ───────────────────────────────────────────────
exports.completeGRN = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, isDeleted: false });
    if (!grn) return notFound(res, 'GRN');
    if (!['receiving', 'quality_check'].includes(grn.status)) {
      return fail(res, 'GRN must be in receiving or quality_check status to complete');
    }
    if (!grn.items.length) return fail(res, 'GRN has no items');

    const adminId   = req.user?._id;
    const adminName = req.user?.name || '';

    // Process each item — update inventory
    for (const item of grn.items) {
      const accepted = Number(item.acceptedQty) || 0;
      const damaged  = Number(item.damageQty)   || 0;

      if (accepted > 0 && item.product) {
        await adjustInventory({
          productId:       item.product,
          warehouse:       grn.warehouse,
          zone:            item.zone || null,
          storageLocation: item.storageLocation || null,
          quantity:        accepted,
          type:            'purchase',
          field:           'availableQty',
          unitCost:        Number(item.unitCost) || 0,
          referenceType:   'GRN',
          referenceId:     grn._id,
          referenceNumber: grn.grnNumber,
          performedById:   adminId,
          performedByName: adminName,
          performedByType: 'admin',
          notes:           `GRN receipt: ${grn.grnNumber}`,
        });

        // Create Batch record if batch number provided
        if (item.batchNumber) {
          const existing = await Batch.findOne({ batchNumber: item.batchNumber, product: item.product, warehouse: grn.warehouse });
          if (existing) {
            existing.availableQty += accepted;
            await existing.save();
          } else {
            await Batch.create({
              batchNumber:      item.batchNumber,
              product:          item.product,
              warehouse:        grn.warehouse,
              zone:             item.zone || null,
              storageLocation:  item.storageLocation || null,
              grn:              grn._id,
              supplier:         grn.supplier,
              manufacturingDate:item.manufacturingDate,
              expiryDate:       item.expiryDate,
              initialQty:       accepted,
              availableQty:     accepted,
              costPerUnit:      Number(item.unitCost) || 0,
            });
          }
        }
      }

      if (damaged > 0 && item.product) {
        await adjustInventory({
          productId:       item.product,
          warehouse:       grn.warehouse,
          zone:            item.zone || null,
          storageLocation: item.storageLocation || null,
          quantity:        damaged,
          type:            'damage',
          field:           'damagedQty',
          unitCost:        Number(item.unitCost) || 0,
          referenceType:   'GRN',
          referenceId:     grn._id,
          referenceNumber: grn.grnNumber,
          performedById:   adminId,
          performedByName: adminName,
          performedByType: 'admin',
          notes:           `Damaged on GRN receipt: ${grn.grnNumber}`,
        });
      }
    }

    grn.status      = 'completed';
    grn.completedAt = new Date();
    await grn.save();

    return ok(res, grn, 'GRN completed — inventory updated');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/grn/:id/cancel ─────────────────────────────────────────────────
exports.cancelGRN = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, isDeleted: false });
    if (!grn) return notFound(res, 'GRN');
    if (grn.status === 'completed') return fail(res, 'Cannot cancel a completed GRN');

    grn.status  = 'cancelled';
    grn.remarks = (grn.remarks || '') + ` [Cancelled: ${req.body.reason || 'No reason given'}]`;
    await grn.save();
    return ok(res, grn, 'GRN cancelled');
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/grn/stats ──────────────────────────────────────────────────────
exports.getGRNStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const matchBase = { isDeleted: false };
    if (warehouseId) matchBase.warehouse = require('mongoose').Types.ObjectId(warehouseId);

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [byStatus, todayGRNs, totalValue] = await Promise.all([
      GRN.aggregate([
        { $match: matchBase },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      GRN.countDocuments({ ...matchBase, createdAt: { $gte: today } }),
      GRN.aggregate([
        { $match: { ...matchBase, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } },
      ]),
    ]);

    const stats = { byStatus: {}, todayGRNs, totalValue: totalValue[0]?.total || 0 };
    byStatus.forEach(s => { stats.byStatus[s._id] = s.count; });

    return ok(res, stats);
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse portal: receive stock (protectWarehouse) ────────────────────────
exports.warehouseGetGRNs = async (req, res) => {
  try {
    const whId = req.warehouseUser?.warehouse;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false, warehouse: whId };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      GRN.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      GRN.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.warehouseCompleteGRN = async (req, res) => {
  try {
    const grn = await GRN.findOne({ _id: req.params.id, warehouse: req.warehouseUser?.warehouse, isDeleted: false });
    if (!grn) return notFound(res, 'GRN');
    if (!['pending', 'receiving', 'quality_check'].includes(grn.status)) {
      return fail(res, 'GRN cannot be completed from current status');
    }

    const { items } = req.body;
    if (items && Array.isArray(items)) {
      grn.items = items;
      Object.assign(grn, calcTotals(items));
    }

    const whUserId   = req.warehouseUser?._id;
    const whUserName = req.warehouseUser?.name || '';

    for (const item of grn.items) {
      const accepted = Number(item.acceptedQty) || 0;
      const damaged  = Number(item.damageQty)   || 0;

      if (accepted > 0 && item.product) {
        await adjustInventory({
          productId: item.product, warehouse: grn.warehouse,
          zone: item.zone || null, storageLocation: item.storageLocation || null,
          quantity: accepted, type: 'purchase', field: 'availableQty',
          unitCost: Number(item.unitCost) || 0,
          referenceType: 'GRN', referenceId: grn._id, referenceNumber: grn.grnNumber,
          performedById: whUserId, performedByName: whUserName, performedByType: 'warehouse_user',
          notes: `Warehouse receipt: ${grn.grnNumber}`,
        });
      }

      if (damaged > 0 && item.product) {
        await adjustInventory({
          productId: item.product, warehouse: grn.warehouse,
          zone: item.zone || null, storageLocation: item.storageLocation || null,
          quantity: damaged, type: 'damage', field: 'damagedQty',
          unitCost: Number(item.unitCost) || 0,
          referenceType: 'GRN', referenceId: grn._id, referenceNumber: grn.grnNumber,
          performedById: whUserId, performedByName: whUserName, performedByType: 'warehouse_user',
          notes: `Damaged on receipt: ${grn.grnNumber}`,
        });
      }
    }

    grn.status          = 'completed';
    grn.completedAt     = new Date();
    grn.receivedBy      = whUserId;
    grn.receivedByName  = whUserName;
    await grn.save();

    return ok(res, grn, 'GRN completed — inventory updated');
  } catch (err) { return serverError(res, err); }
};
