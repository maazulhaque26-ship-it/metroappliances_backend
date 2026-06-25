'use strict';
const mongoose = require('mongoose');
const MRPRun              = require('../models/MRPRun');
const MaterialRequirement = require('../models/MaterialRequirement');
const MRPReservation      = require('../models/MRPReservation');
const MaterialShortage    = require('../models/MaterialShortage');
const PurchaseSuggestion  = require('../models/PurchaseSuggestion');
const ProductionRequirement = require('../models/ProductionRequirement');
const InventoryProjection = require('../models/InventoryProjection');
const BillOfMaterials     = require('../models/BillOfMaterials');
const Inventory           = require('../models/Inventory');
const PurchaseOrder       = require('../models/PurchaseOrder');
const ProductionOrder     = require('../models/ProductionOrder');
const ProductionPlan      = require('../models/ProductionPlan');
const SafetyStockRule     = require('../models/SafetyStockRule');
const AuditLog            = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const INCOMING_PO_STATUSES = ['approved','released','sent','acknowledged','partially_delivered'];

// ─── BOM explosion ──────────────────────────────────────────────────────────
async function explodeBOM(productId, qty, depth, acc) {
  if (depth > 10) return;
  const bom = await BillOfMaterials.findOne({
    product: productId,
    status:  { $in: ['active', 'approved'] },
    isDeleted: false,
  }).populate('items');
  if (!bom || !bom.items || !bom.items.length) return;
  for (const item of bom.items) {
    const effectiveQty = qty * item.quantity * (1 + (item.wasteAllowance || 0) / 100);
    const matId = String(item.rawMaterial);
    if (!acc[matId]) {
      acc[matId] = {
        material:        item.rawMaterial,
        materialName:    item.rawMaterialName || '',
        materialSKU:     item.rawMaterialSKU  || '',
        unit:            item.unit || 'pcs',
        grossRequirement: 0,
        bomLevel:        depth,
      };
    }
    acc[matId].grossRequirement += effectiveQty;
    if (acc[matId].bomLevel > depth) acc[matId].bomLevel = depth;
    await explodeBOM(item.rawMaterial, effectiveQty, depth + 1, acc);
  }
}

// ─── Main MRP engine ────────────────────────────────────────────────────────
exports.runMRP = async (req, res) => {
  const startedAt = Date.now();
  let run;
  try {
    const {
      runType = 'full', factory, planningHorizon = 90,
      horizonStart, horizonEnd, productionPlans = [], productionOrders = [],
      autoReserve = true, autoCreateSuggestions = true, notes = '',
    } = req.body;

    if (!horizonStart || !horizonEnd) return fail(res, 'horizonStart and horizonEnd are required');

    run = await MRPRun.create({
      runType, factory, planningHorizon,
      horizonStart: new Date(horizonStart),
      horizonEnd:   new Date(horizonEnd),
      productionPlans, productionOrders,
      autoReserve, autoCreateSuggestions, notes,
      createdBy:     req.user?._id,
      createdByName: req.user?.name || '',
      status: 'running',
      startedAt: new Date(),
    });

    const io = req.app.locals.io;
    if (io) io.emit('mrp:started', { runId: run._id, runNumber: run.runNumber });

    // ── Phase 1: gather demand sources ──
    const demandItems = [];

    // From production plans
    const planIds = productionPlans.length
      ? productionPlans
      : (await ProductionPlan.find({ status: { $in: ['approved','released'] }, isDeleted: false, ...(factory ? { factory } : {}) }).select('_id product targetOutput factory')).map(p => p._id);

    const plans = await ProductionPlan.find({ _id: { $in: planIds }, isDeleted: false }).select('product targetOutput factory planNumber');
    for (const plan of plans) {
      if (plan.product && plan.targetOutput > 0) {
        demandItems.push({ product: plan.product, qty: plan.targetOutput, source: 'production_plan', sourceRef: plan._id, factory: plan.factory });
      }
    }

    // From production orders
    const orderIds = productionOrders.length
      ? productionOrders
      : (await ProductionOrder.find({ status: { $in: ['confirmed','scheduled'] }, isDeleted: false, ...(factory ? { factory } : {}) }).select('_id')).map(o => o._id);

    const orders = await ProductionOrder.find({ _id: { $in: orderIds }, isDeleted: false }).select('product plannedQuantity factory bom orderNumber');
    for (const order of orders) {
      if (order.product && order.plannedQuantity > 0) {
        demandItems.push({ product: order.product, qty: order.plannedQuantity, source: 'production_order', sourceRef: order._id, factory: order.factory });
      }
    }

    // ── Phase 2: BOM explosion ──
    const materialAcc = {};
    for (const demand of demandItems) {
      await explodeBOM(demand.product, demand.qty, 1, materialAcc);
    }

    // ── Phase 3: fetch inventory & incoming POs ──
    const materialIds = Object.keys(materialAcc).map(id => new mongoose.Types.ObjectId(id));

    const inventories = await Inventory.find({
      product:   { $in: materialIds },
      isDeleted: false,
      ...(factory ? { warehouse: { $exists: true } } : {}),
    });
    const invMap = {};
    for (const inv of inventories) {
      const pid = String(inv.product);
      if (!invMap[pid]) invMap[pid] = { availableQty: 0, reservedQty: 0, incomingQty: 0 };
      invMap[pid].availableQty += (inv.availableQty || 0);
      invMap[pid].reservedQty  += (inv.reservedQty  || 0);
      invMap[pid].incomingQty  += (inv.incomingQty  || 0);
    }

    const poItems = await PurchaseOrder.aggregate([
      { $match: { status: { $in: INCOMING_PO_STATUSES }, isDeleted: false } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', incomingPOQty: { $sum: { $subtract: ['$items.quantity', { $ifNull: ['$items.receivedQuantity', 0] }] } } } },
    ]);
    const poMap = {};
    for (const p of poItems) poMap[String(p._id)] = p.incomingPOQty;

    const safetyRules = await SafetyStockRule.find({ material: { $in: materialIds }, isActive: true, isDeleted: false });
    const ssMap = {};
    for (const r of safetyRules) ssMap[String(r.material)] = r;

    // ── Phase 4: compute net requirements & create documents ──
    const createdReqs = [];
    const createdShortages = [];
    const createdReservations = [];
    const createdPurchaseSuggestions = [];
    const createdProdReqs = [];
    const projectionDocs = [];

    for (const [matId, mat] of Object.entries(materialAcc)) {
      const inv         = invMap[matId] || { availableQty: 0, reservedQty: 0 };
      const incomingPO  = poMap[matId] || 0;
      const available   = Math.max(0, inv.availableQty - inv.reservedQty);
      const ss          = ssMap[matId];
      const safetyStock = ss ? ss.safetyStockQty : 0;
      const netReq      = Math.max(0, mat.grossRequirement - available - incomingPO);
      const shortageQty = Math.max(0, netReq - safetyStock);
      const reqStatus   = shortageQty > 0 ? 'shortage' : (netReq > 0 ? 'open' : 'fulfilled');

      const req = await MaterialRequirement.create({
        mrpRun:           run._id,
        material:         mat.material,
        materialName:     mat.materialName,
        materialSKU:      mat.materialSKU,
        unit:             mat.unit,
        grossRequirement: mat.grossRequirement,
        availableQty:     available,
        reservedQty:      inv.reservedQty,
        incomingPOQty:    incomingPO,
        netRequirement:   netReq,
        shortageQty,
        bomLevel:         mat.bomLevel,
        status:           reqStatus,
      });
      createdReqs.push(req);

      // Reservation
      if (autoReserve && available > 0 && mat.grossRequirement > 0) {
        const reserveQty = Math.min(available, mat.grossRequirement);
        const res2 = await MRPReservation.create({
          mrpRun:              run._id,
          materialRequirement: req._id,
          material:            mat.material,
          materialName:        mat.materialName,
          quantity:            reserveQty,
          unit:                mat.unit,
          status:              'active',
        });
        createdReservations.push(res2);
      }

      // Shortage doc
      if (shortageQty > 0) {
        const severity = shortageQty / mat.grossRequirement > 0.5 ? 'critical' : shortageQty / mat.grossRequirement > 0.25 ? 'high' : 'medium';
        const shortage = await MaterialShortage.create({
          mrpRun:              run._id,
          materialRequirement: req._id,
          material:            mat.material,
          materialName:        mat.materialName,
          materialSKU:         mat.materialSKU,
          unit:                mat.unit,
          shortageQty,
          severity,
          status: 'open',
        });
        createdShortages.push(shortage);

        // Purchase suggestion
        if (autoCreateSuggestions) {
          const ps = await PurchaseSuggestion.create({
            mrpRun:       run._id,
            material:     mat.material,
            materialName: mat.materialName,
            materialSKU:  mat.materialSKU,
            unit:         mat.unit,
            quantity:     shortageQty,
            priority:     severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium',
            shortage:     shortage._id,
            status:       'pending',
          });
          createdPurchaseSuggestions.push(ps);
        }
      }

      // Inventory projection (simplified: per run, one projection record per material)
      projectionDocs.push({
        mrpRun:         run._id,
        material:       mat.material,
        materialName:   mat.materialName,
        materialSKU:    mat.materialSKU,
        projectionDate: new Date(horizonEnd),
        openingQty:     available,
        expectedIn:     incomingPO,
        expectedOut:    mat.grossRequirement,
        reservedQty:    inv.reservedQty,
        projectedQty:   Math.max(0, available + incomingPO - mat.grossRequirement),
        safetyStock,
        reorderPoint:   ss ? ss.reorderPoint : 0,
        isBelowSafety:  (available + incomingPO - mat.grossRequirement) < safetyStock,
        isBelowReorder: ss ? (available + incomingPO - mat.grossRequirement) < ss.reorderPoint : false,
        unit:           mat.unit,
      });
    }

    if (projectionDocs.length) {
      await InventoryProjection.insertMany(projectionDocs);
    }

    // Production requirements from demand sources
    if (autoCreateSuggestions) {
      for (const demand of demandItems) {
        const pr = await ProductionRequirement.create({
          mrpRun:     run._id,
          product:    demand.product,
          quantity:   demand.qty,
          source:     demand.source,
          sourceRef:  demand.sourceRef,
          factory:    demand.factory,
          status:     'pending',
        });
        createdProdReqs.push(pr);
      }
    }

    // ── Phase 5: finalize run ──
    const durationMs = Date.now() - startedAt;
    await MRPRun.findByIdAndUpdate(run._id, {
      status:                    'completed',
      completedAt:               new Date(),
      durationMs,
      totalRequirements:          createdReqs.length,
      totalShortages:             createdShortages.length,
      totalReservations:          createdReservations.length,
      totalPurchaseSuggestions:   createdPurchaseSuggestions.length,
      totalProductionSuggestions: createdProdReqs.length,
    });

    await AuditLog.create({
      admin:      req.user?._id, adminName: req.user?.name || '', adminEmail: req.user?.email || '',
      adminRole:  req.user?.role || 'admin', action: 'create', entity: 'MRPRun',
      entityId:   run._id, entityLabel: run.runNumber,
      changes:    { before: null, after: { runType, totalRequirements: createdReqs.length, totalShortages: createdShortages.length } },
      ip:         req.ip, userAgent: req.headers['user-agent'],
    });

    if (io) io.emit('mrp:completed', { runId: run._id, runNumber: run.runNumber, totalShortages: createdShortages.length });

    const completed = await MRPRun.findById(run._id);
    return created(res, completed, 'MRP run completed successfully');
  } catch (err) {
    if (run?._id) {
      await MRPRun.findByIdAndUpdate(run._id, { status: 'failed', completedAt: new Date(), errorMessage: err.message, durationMs: Date.now() - startedAt }).catch(() => {});
      const io = req.app.locals.io;
      if (io) io.emit('mrp:failed', { runId: run._id, error: err.message });
    }
    return serverError(res, err);
  }
};

exports.getMRPRuns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, factory, runType } = req.query;
    const filter = { isDeleted: false };
    if (status)  filter.status  = status;
    if (factory) filter.factory = factory;
    if (runType) filter.runType = runType;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await MRPRun.countDocuments(filter);
    const data  = await MRPRun.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('factory', 'name');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.getMRPRun = async (req, res) => {
  try {
    const run = await MRPRun.findOne({ _id: req.params.id, isDeleted: false }).populate('factory', 'name');
    if (!run) return notFound(res, 'MRP run not found');
    return ok(res, run);
  } catch (err) { return serverError(res, err); }
};

exports.cancelRun = async (req, res) => {
  try {
    const run = await MRPRun.findOne({ _id: req.params.id, isDeleted: false });
    if (!run) return notFound(res, 'MRP run not found');
    if (!['pending','running'].includes(run.status)) return fail(res, 'Only pending or running MRP runs can be cancelled');
    run.status = 'cancelled';
    await run.save();
    return ok(res, run, 'MRP run cancelled');
  } catch (err) { return serverError(res, err); }
};
