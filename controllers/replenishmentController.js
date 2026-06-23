const mongoose          = require('mongoose');
const ReplenishmentTask = require('../models/ReplenishmentTask');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── Admin: auto-generate replenishment tasks for a warehouse ──────────────────
exports.generateTasks = async (req, res) => {
  try {
    const { warehouseId } = req.body;
    if (!warehouseId) return fail(res, 'warehouseId is required');

    // Reuse inventory engine from Sprint 10B
    const InventoryItem = require('../models/InventoryItem');
    const items = await InventoryItem.find({
      warehouseId,
      $expr: { $lte: ['$quantityOnHand', '$reorderPoint'] },
    }).lean();

    if (items.length === 0) return ok(res, { created: 0, message: 'No items need replenishment' });

    const tasks = [];
    for (const item of items) {
      const existing = await ReplenishmentTask.findOne({
        sku: item.sku, warehouseId, status: { $in: ['pending', 'approved', 'ordered'] },
      });
      if (existing) continue;

      const current    = item.quantityOnHand;
      const max        = item.maxStockLevel || item.reorderPoint * 3;
      const safety     = item.safetyStock   || 0;
      const shortfall  = max - current;
      const priority   = current <= 0 ? 'critical' : current <= safety ? 'high' : 'medium';

      tasks.push({
        productId:      item.productId,
        sku:            item.sku,
        productName:    item.productName,
        warehouseId,
        currentStock:   current,
        safetyStock:    safety,
        minLevel:       item.reorderPoint || 0,
        maxLevel:       max,
        recommendedQty: Math.max(shortfall, 1),
        netShortfall:   shortfall,
        triggerType:    current <= safety ? 'auto_low_stock' : 'auto_min_max',
        triggerReason:  `Stock ${current} ≤ reorder point ${item.reorderPoint}`,
        priority,
      });
    }

    if (tasks.length === 0) return ok(res, { created: 0, message: 'All items already have pending tasks' });
    const created_ = await ReplenishmentTask.insertMany(tasks);

    const io = req.app.locals.io;
    if (io) io.emit('replenishment:tasks_generated', { warehouseId, count: created_.length });
    return created(res, { created: created_.length, tasks: created_ }, `${created_.length} replenishment task(s) generated`);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: list tasks ─────────────────────────────────────────────────────────
exports.getTasks = async (req, res) => {
  try {
    const { warehouseId, status, priority, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (status)      filter.status      = status;
    if (priority)    filter.priority    = priority;
    const total = await ReplenishmentTask.countDocuments(filter);
    const tasks = await ReplenishmentTask.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .skip((page-1)*limit).limit(+limit).lean();
    return paginated(res, tasks, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: single task ────────────────────────────────────────────────────────
exports.getTask = async (req, res) => {
  try {
    const task = await ReplenishmentTask.findById(req.params.id)
      .populate('linkedPOId', 'poNumber status totalAmount').lean();
    if (!task) return notFound(res, 'ReplenishmentTask');
    return ok(res, task);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: approve task ───────────────────────────────────────────────────────
exports.approveTask = async (req, res) => {
  try {
    const task = await ReplenishmentTask.findById(req.params.id);
    if (!task) return notFound(res, 'ReplenishmentTask');
    if (task.status !== 'pending') return fail(res, `Task is already ${task.status}`);
    task.status     = 'approved';
    task.approvedBy = req.user._id;
    task.approvedAt = new Date();
    await task.save();
    return ok(res, task, 'Task approved');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: update task ────────────────────────────────────────────────────────
exports.updateTask = async (req, res) => {
  try {
    const task = await ReplenishmentTask.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return notFound(res, 'ReplenishmentTask');
    return ok(res, task, 'Task updated');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: cancel task ────────────────────────────────────────────────────────
exports.cancelTask = async (req, res) => {
  try {
    const task = await ReplenishmentTask.findByIdAndUpdate(req.params.id,
      { status: 'cancelled', isActive: false }, { new: true });
    if (!task) return notFound(res, 'ReplenishmentTask');
    return ok(res, task, 'Task cancelled');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: replenishment stats ────────────────────────────────────────────────
exports.getReplenishmentStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;

    const [total, pending, approved, ordered, critical, high] = await Promise.all([
      ReplenishmentTask.countDocuments(filter),
      ReplenishmentTask.countDocuments({ ...filter, status: 'pending' }),
      ReplenishmentTask.countDocuments({ ...filter, status: 'approved' }),
      ReplenishmentTask.countDocuments({ ...filter, status: 'ordered' }),
      ReplenishmentTask.countDocuments({ ...filter, priority: 'critical' }),
      ReplenishmentTask.countDocuments({ ...filter, priority: 'high' }),
    ]);

    const byTrigger = await ReplenishmentTask.aggregate([
      { $match: filter },
      { $group: { _id: '$triggerType', count: { $sum: 1 } } },
    ]);

    return ok(res, { total, pending, approved, ordered, critical, high, byTrigger });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: smart replenishment recommendations ────────────────────────────────
exports.getRecommendations = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    if (!warehouseId) return fail(res, 'warehouseId required');

    const InventoryItem = require('../models/InventoryItem');
    const PurchaseOrder = require('../models/PurchaseOrder');

    const [lowItems, pendingPOs] = await Promise.all([
      InventoryItem.find({
        warehouseId,
        $expr: { $lte: ['$quantityOnHand', '$reorderPoint'] },
      }).sort({ quantityOnHand: 1 }).limit(50).lean(),
      PurchaseOrder.find({ warehouseId, status: { $in: ['approved', 'sent', 'partially_received'] } })
        .select('lineItems status').lean(),
    ]);

    const pendingPOSkus = new Set();
    for (const po of pendingPOs) {
      (po.lineItems || []).forEach(l => pendingPOSkus.add(l.sku));
    }

    const recommendations = lowItems.map(item => ({
      sku:           item.sku,
      productName:   item.productName,
      currentStock:  item.quantityOnHand,
      reorderPoint:  item.reorderPoint,
      safetyStock:   item.safetyStock || 0,
      maxStock:      item.maxStockLevel || item.reorderPoint * 3,
      hasPendingPO:  pendingPOSkus.has(item.sku),
      urgency:       item.quantityOnHand <= 0 ? 'critical' : item.quantityOnHand <= (item.safetyStock || 0) ? 'high' : 'medium',
    }));

    return ok(res, { recommendations, total: recommendations.length });
  } catch (err) { return serverError(res, err); }
};
