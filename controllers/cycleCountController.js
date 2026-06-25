const CycleCount      = require('../models/CycleCount');
const StockAdjustment = require('../models/StockAdjustment');
const Inventory       = require('../models/Inventory');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');
const { generateCCNumber, generateAdjNumber, adjustInventory } = require('../utils/inventoryHelpers');

// ── GET /admin/inventory/cycle-counts ────────────────────────────────────────
exports.getCycleCounts = async (req, res) => {
  try {
    const { page = 1, limit = 20, warehouseId, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (status)      filter.status    = status;

    const [data, total] = await Promise.all([
      CycleCount.find(filter)
        .populate('warehouse', 'name code')
        .populate('zone', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CycleCount.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── GET /admin/inventory/cycle-counts/:id ────────────────────────────────────
exports.getCycleCountById = async (req, res) => {
  try {
    const cc = await CycleCount.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouse', 'name code')
      .populate('zone', 'name code type')
      .populate('items.product', 'name sku images')
      .populate('items.storageLocation', 'rack shelf bin barcode')
      .populate('adjustment')
      .lean();
    if (!cc) return notFound(res, 'Cycle Count');
    return ok(res, cc);
  } catch (err) { return serverError(res, err); }
};

// ── POST /admin/inventory/cycle-counts ───────────────────────────────────────
exports.createCycleCount = async (req, res) => {
  try {
    const { warehouse, zone, scheduledDate, notes } = req.body;
    if (!warehouse) return fail(res, 'warehouse is required');

    // Auto-populate expected items from Inventory
    const invFilter = { warehouse, isDeleted: false };
    if (zone) invFilter.zone = zone;

    const invItems = await Inventory.find(invFilter)
      .populate('product', '_id name sku')
      .lean();

    const items = invItems.map(inv => ({
      product:         inv.product?._id,
      productName:     inv.product?.name || '',
      storageLocation: inv.storageLocation,
      expectedQty:     inv.availableQty,
      countedQty:      0,
      variance:        0,
    }));

    const countNumber = await generateCCNumber();
    const cc = await CycleCount.create({
      countNumber,
      warehouse,
      zone:          zone || null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      items,
      totalExpected: items.reduce((s, i) => s + i.expectedQty, 0),
      status:        'planned',
      notes,
      conductedBy:     req.user?._id || req.warehouseUser?._id,
      conductedByName: req.user?.name || req.warehouseUser?.name || '',
      conductedByType: req.warehouseUser ? 'warehouse_user' : 'admin',
    });

    return created(res, cc, 'Cycle count created');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/cycle-counts/:id/start ───────────────────────────────
exports.startCycleCount = async (req, res) => {
  try {
    const cc = await CycleCount.findOne({ _id: req.params.id, isDeleted: false });
    if (!cc) return notFound(res, 'Cycle Count');
    if (cc.status !== 'planned') return fail(res, 'Only planned counts can be started');

    cc.status    = 'started';
    cc.startedAt = new Date();
    await cc.save();
    return ok(res, cc, 'Cycle count started');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/cycle-counts/:id/items ───────────────────────────────
exports.updateItems = async (req, res) => {
  try {
    const cc = await CycleCount.findOne({ _id: req.params.id, isDeleted: false });
    if (!cc) return notFound(res, 'Cycle Count');
    if (!['started'].includes(cc.status)) return fail(res, 'Count must be in started status to update items');

    const { items } = req.body;
    if (!items?.length) return fail(res, 'items required');

    cc.items = items.map(it => ({
      ...it,
      variance: (Number(it.countedQty) || 0) - (Number(it.expectedQty) || 0),
    }));

    cc.totalCounted      = cc.items.reduce((s, i) => s + (i.countedQty || 0), 0);
    cc.totalExpected     = cc.items.reduce((s, i) => s + (i.expectedQty || 0), 0);
    cc.totalVariance     = cc.items.reduce((s, i) => s + (i.variance || 0), 0);
    cc.itemsWithVariance = cc.items.filter(i => i.variance !== 0).length;

    await cc.save();
    return ok(res, cc, 'Count items updated');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/cycle-counts/:id/complete ───────────────────────────
exports.completeCycleCount = async (req, res) => {
  try {
    const cc = await CycleCount.findOne({ _id: req.params.id, isDeleted: false });
    if (!cc) return notFound(res, 'Cycle Count');
    if (cc.status !== 'started') return fail(res, 'Count must be started to complete');

    cc.status      = 'completed';
    cc.completedAt = new Date();
    await cc.save();
    return ok(res, cc, 'Cycle count completed — pending approval');
  } catch (err) { return serverError(res, err); }
};

// ── PUT /admin/inventory/cycle-counts/:id/approve ─────────────────────────────
exports.approveCycleCount = async (req, res) => {
  try {
    const cc = await CycleCount.findOne({ _id: req.params.id, isDeleted: false });
    if (!cc) return notFound(res, 'Cycle Count');
    if (cc.status !== 'completed') return fail(res, 'Count must be completed to approve');

    const itemsWithVariance = cc.items.filter(i => i.variance !== 0);
    let adj = null;

    if (itemsWithVariance.length > 0) {
      const adjNumber = await generateAdjNumber();
      adj = await StockAdjustment.create({
        adjustmentNumber: adjNumber,
        warehouse:        cc.warehouse,
        status:           'applied',
        items:            itemsWithVariance.map(it => ({
          product:     it.product,
          productName: it.productName,
          reason:      'correction',
          currentQty:  it.expectedQty,
          adjustedQty: it.variance,
          notes:       `Cycle count variance: ${cc.countNumber}`,
        })),
        requestedBy:     cc.conductedBy,
        requestedByName: cc.conductedByName,
        approvedBy:      req.user?._id,
        approvedByName:  req.user?.name || '',
        approvedAt:      new Date(),
        appliedAt:       new Date(),
        notes:           `Auto-generated from Cycle Count ${cc.countNumber}`,
      });

      // Apply variances to inventory
      for (const item of itemsWithVariance) {
        if (!item.product || item.variance === 0) continue;
        await adjustInventory({
          productId:       item.product,
          warehouse:       cc.warehouse,
          storageLocation: item.storageLocation || null,
          quantity:        item.variance,
          type:            'cycle_count',
          field:           'availableQty',
          referenceType:   'CycleCount',
          referenceId:     cc._id,
          referenceNumber: cc.countNumber,
          performedById:   req.user?._id,
          performedByName: req.user?.name || '',
          performedByType: 'admin',
          notes:           `Cycle count variance adjustment: ${cc.countNumber}`,
        });
      }
    }

    cc.status               = 'approved';
    cc.approvedAt           = new Date();
    cc.approvedBy           = req.user?._id;
    cc.approvedByName       = req.user?.name || '';
    cc.adjustmentGenerated  = itemsWithVariance.length > 0;
    if (adj) cc.adjustment  = adj._id;
    await cc.save();

    return ok(res, cc, `Cycle count approved${adj ? ' — adjustment created' : ''}`);
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: cycle count endpoints ─────────────────────────────────────────
exports.warehouseGetCycleCounts = async (req, res) => {
  try {
    const whId = req.warehouseUser?.warehouse;
    const { page = 1, limit = 20, status } = req.query;
    const skip   = (page - 1) * limit;
    const filter = { warehouse: whId, isDeleted: false };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      CycleCount.find(filter).populate('zone', 'name code').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      CycleCount.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.warehouseUpdateCycleCount = async (req, res) => {
  try {
    const cc = await CycleCount.findOne({ _id: req.params.id, warehouse: req.warehouseUser?.warehouse, isDeleted: false });
    if (!cc) return notFound(res, 'Cycle Count');
    if (!['started'].includes(cc.status)) return fail(res, 'Count must be started');

    const { items } = req.body;
    if (items?.length) {
      cc.items = items.map(it => ({
        ...it,
        variance: (Number(it.countedQty) || 0) - (Number(it.expectedQty) || 0),
      }));
      cc.totalCounted  = cc.items.reduce((s, i) => s + (i.countedQty || 0), 0);
      cc.totalVariance = cc.items.reduce((s, i) => s + (i.variance || 0), 0);
    }
    await cc.save();
    return ok(res, cc, 'Count updated');
  } catch (err) { return serverError(res, err); }
};
