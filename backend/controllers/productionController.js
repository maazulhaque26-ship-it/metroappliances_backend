'use strict';
const ProductionOrder = require('../models/ProductionOrder');
const ProductionBatch = require('../models/ProductionBatch');
const BillOfMaterials = require('../models/BillOfMaterials');
const BOMItem         = require('../models/BOMItem');
const AuditLog        = require('../models/AuditLog');
const { adjustInventory } = require('../utils/inventoryHelpers');
const { ok, created, paginated, fail, notFound, serverError, noContent } = require('../utils/response');

function audit(req, action, order, before = null) {
  try {
    AuditLog.create({
      admin: req.user._id, adminName: req.user.name || '', adminEmail: req.user.email || '',
      adminRole: req.user.role || 'admin', action, entity: 'ProductionOrder',
      entityId: order._id, entityLabel: order.orderNumber,
      changes: { before, after: order.toObject ? order.toObject() : order },
      ip: req.ip, userAgent: req.get('user-agent') || '',
    });
  } catch (_) {}
}

function pushHistory(order, status, note, userId, userName) {
  order.history.push({ status, note, changedBy: userId, changedByName: userName, changedAt: new Date() });
}

exports.createOrder = async (req, res) => {
  try {
    const data  = { ...req.body };
    if (data.bom) {
      const bom = await BillOfMaterials.findById(data.bom)
        .populate({ path: 'items', match: { isDeleted: false } });
      if (bom?.items?.length) {
        data.rawMaterials = bom.items.map(item => ({
          product: item.rawMaterial,
          productName: item.rawMaterialName,
          planned: item.quantity * (data.plannedQuantity || 1),
          consumed: 0,
          unit: item.unit,
        }));
        data.estimatedCost = bom.estimatedCostPerUnit * (data.plannedQuantity || 1);
      }
    }
    const order = await ProductionOrder.create(data);
    pushHistory(order, 'draft', 'Order created', req.user._id, req.user.name);
    await order.save();
    audit(req, 'PRODUCTION_ORDER_CREATED', order);
    const io = req.app.locals.io;
    if (io) io.emit('manufacturing:order_created', { orderNumber: order.orderNumber, productName: order.productName });
    return created(res, order, 'Production order created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, factory, priority, search } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status   = status;
    if (factory)  filter.factory  = factory;
    if (priority) filter.priority = priority;
    if (search)   filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
    ];
    const total = await ProductionOrder.countDocuments(filter);
    const data  = await ProductionOrder.find(filter)
      .populate('factory', 'name code')
      .populate('workCenter', 'name code')
      .populate('product', 'name sku')
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit)).limit(Number(limit));
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await ProductionOrder.findOne({ _id: req.params.id, isDeleted: false })
      .populate('factory', 'name code')
      .populate('workCenter', 'name code')
      .populate('shift', 'name startTime endTime')
      .populate('product', 'name sku price')
      .populate('bom', 'bomNumber version status')
      .populate('targetWarehouse', 'name code');
    if (!order) return notFound(res, 'Production order');
    const batches = await ProductionBatch.find({ productionOrder: order._id, isDeleted: false })
      .populate('machine', 'name code').sort({ createdAt: 1 });
    return ok(res, { ...order.toObject(), batches });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await ProductionOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return notFound(res, 'Production order');
    if (['completed', 'cancelled'].includes(order.status))
      return fail(res, 'Cannot edit a completed or cancelled order');
    const before = order.toObject();
    const { history, orderNumber, ...updates } = req.body;
    Object.assign(order, updates);
    await order.save();
    audit(req, 'PRODUCTION_ORDER_UPDATED', order, before);
    return ok(res, order, 'Production order updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await ProductionOrder.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'draft' },
      { isDeleted: true },
      { new: true }
    );
    if (!order) return notFound(res, 'Production order (only draft orders can be deleted)');
    audit(req, 'PRODUCTION_ORDER_DELETED', order);
    return noContent(res, 'Production order deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.startOrder = async (req, res) => {
  try {
    const order = await ProductionOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return notFound(res, 'Production order');
    if (!['confirmed', 'scheduled', 'paused'].includes(order.status))
      return fail(res, `Cannot start order with status: ${order.status}`);
    const before = order.toObject();
    order.status = 'in_progress';
    if (!order.actualStartDate) order.actualStartDate = new Date();
    pushHistory(order, 'in_progress', req.body.note || 'Production started', req.user._id, req.user.name);
    await order.save();
    audit(req, 'PRODUCTION_ORDER_STARTED', order, before);
    const io = req.app.locals.io;
    if (io) io.emit('manufacturing:order_started', { orderNumber: order.orderNumber });
    return ok(res, order, 'Production order started');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.pauseOrder = async (req, res) => {
  try {
    const order = await ProductionOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return notFound(res, 'Production order');
    if (order.status !== 'in_progress') return fail(res, 'Only in-progress orders can be paused');
    const before = order.toObject();
    order.status = 'paused';
    pushHistory(order, 'paused', req.body.note || 'Production paused', req.user._id, req.user.name);
    await order.save();
    audit(req, 'PRODUCTION_ORDER_PAUSED', order, before);
    return ok(res, order, 'Production order paused');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const order = await ProductionOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return notFound(res, 'Production order');
    if (!['in_progress', 'paused'].includes(order.status))
      return fail(res, `Cannot complete order with status: ${order.status}`);
    const before = order.toObject();
    const { completedQuantity, rejectedQuantity = 0 } = req.body;
    if (completedQuantity != null) order.completedQuantity = Number(completedQuantity);
    if (rejectedQuantity  != null) order.rejectedQuantity  = Number(rejectedQuantity);
    order.status      = 'completed';
    order.actualEndDate = new Date();
    pushHistory(order, 'completed', req.body.note || 'Production completed', req.user._id, req.user.name);
    await order.save();

    // Update finished goods inventory if targetWarehouse is set
    if (order.targetWarehouse && order.completedQuantity > 0) {
      try {
        await adjustInventory({
          productId: order.product,
          warehouse: order.targetWarehouse,
          quantity: order.completedQuantity,
          type: 'adjustment',
          referenceType: 'ProductionOrder',
          referenceId:   order._id,
          referenceNumber: order.orderNumber,
          performedById:  req.user._id,
          performedByName: req.user.name || '',
          notes: `Finished goods from production order ${order.orderNumber}`,
        });
      } catch (invErr) {
        console.error('Inventory update failed:', invErr.message);
      }
    }

    audit(req, 'PRODUCTION_ORDER_COMPLETED', order, before);
    const io = req.app.locals.io;
    if (io) io.emit('manufacturing:order_completed', { orderNumber: order.orderNumber, qty: order.completedQuantity });
    return ok(res, order, 'Production order completed');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await ProductionOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return notFound(res, 'Production order');
    if (['completed', 'cancelled'].includes(order.status))
      return fail(res, `Order is already ${order.status}`);
    const before = order.toObject();
    order.status = 'cancelled';
    pushHistory(order, 'cancelled', req.body.note || 'Order cancelled', req.user._id, req.user.name);
    await order.save();
    audit(req, 'PRODUCTION_ORDER_CANCELLED', order, before);
    return ok(res, order, 'Production order cancelled');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createBatch = async (req, res) => {
  try {
    const order = await ProductionOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return notFound(res, 'Production order');
    const batch = await ProductionBatch.create({
      ...req.body, productionOrder: order._id, product: order.product,
    });
    audit(req, 'PRODUCTION_BATCH_CREATED', order);
    return created(res, batch, 'Batch created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const batch = await ProductionBatch.findOne({
      _id: req.params.batchId,
      productionOrder: req.params.id,
      isDeleted: false,
    });
    if (!batch) return notFound(res, 'Batch');
    Object.assign(batch, req.body);
    if (req.body.status === 'completed' && !batch.completedAt) batch.completedAt = new Date();
    if (req.body.status === 'in_progress' && !batch.startedAt) batch.startedAt = new Date();
    await batch.save();

    // Roll up completed qty to order
    const allBatches = await ProductionBatch.find({ productionOrder: req.params.id, isDeleted: false });
    const totalCompleted = allBatches.reduce((s, b) => s + (b.completedQty || 0), 0);
    const totalRejected  = allBatches.reduce((s, b) => s + (b.rejectedQty || 0), 0);
    await ProductionOrder.findByIdAndUpdate(req.params.id, {
      completedQuantity: totalCompleted, rejectedQuantity: totalRejected,
    });

    return ok(res, batch, 'Batch updated');
  } catch (err) {
    return serverError(res, err);
  }
};
