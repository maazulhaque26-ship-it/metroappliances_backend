/**
 * Sprint 10E — Smart Putaway Engine
 * Recommends optimal bins based on product attributes, bin capacity, and location rules
 */
const StorageLocation = require('../models/StorageLocation');
const Inventory       = require('../models/Inventory');
const Product         = require('../models/Product');
const Batch           = require('../models/Batch');
const ScanLog         = require('../models/ScanLog');
const { ok, fail, notFound, serverError } = require('../utils/response');

// ─── Scoring heuristics ────────────────────────────────────────────────────────

function scoreBin(bin, product, criteria = {}) {
  let score = 100;

  // Penalize nearly-full bins
  const utilization = bin.capacity > 0 ? bin.occupied / bin.capacity : 1;
  score -= utilization * 40;

  // Reward proximity preferences
  if (criteria.nearReceiving && bin.nearReceiving) score += 20;
  if (criteria.nearDispatch  && bin.nearDispatch)  score += 15;
  if (criteria.fastMoving    && bin.isFastMoving)  score += 10;

  // Temperature match
  if (criteria.temperatureZone && bin.temperatureZone !== criteria.temperatureZone) score -= 50;

  // Hazmat compliance
  if (criteria.isHazmat && !bin.isHazmat) score -= 80;
  if (!criteria.isHazmat && bin.isHazmat) score -= 30;

  // Weight capacity
  if (criteria.weightPerUnit && bin.weightCapacity > 0) {
    const remainingCap = bin.weightCapacity - (bin.occupied * (criteria.weightPerUnit || 0));
    if (remainingCap < (criteria.weightPerUnit || 0)) score -= 60;
  }

  return Math.max(0, score);
}

// ─── Controllers ───────────────────────────────────────────────────────────────

exports.getPutawayRecommendations = async (req, res) => {
  try {
    const { productId, warehouseId, quantity = 1, batchId } = req.body;

    if (!productId || !warehouseId) return fail(res, 'productId and warehouseId are required');

    const product = await Product.findById(productId);
    if (!product) return notFound(res, 'Product');

    // Determine putaway criteria from product attributes
    const criteria = {
      nearReceiving: true, // default: putaway near receiving area
      temperatureZone: 'ambient',
      isHazmat: false,
      fastMoving: product.isBestSeller || product.isDealOfDay,
      nearDispatch: product.isBestSeller,
    };

    if (batchId) {
      const batch = await Batch.findById(batchId);
      if (batch?.expiryDate) {
        const daysToExpiry = (new Date(batch.expiryDate) - new Date()) / 86400000;
        if (daysToExpiry < 90) criteria.nearDispatch = true; // near expiry → near dispatch
      }
    }

    // Find available bins
    const bins = await StorageLocation.find({
      warehouse: warehouseId,
      status: 'available',
      isActive: true,
      isDeleted: false,
      $expr: { $lt: ['$occupied', '$capacity'] },
    }).populate('zone', 'name type').limit(50);

    if (bins.length === 0) {
      return ok(res, { recommendations: [], message: 'No available bins found in this warehouse' });
    }

    // Score and sort bins
    const scored = bins
      .map(bin => ({ bin, score: scoreBin(bin, product, criteria) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ bin, score }) => ({
        binId:       bin._id,
        binCode:     `${bin.rack}-${bin.shelf}${bin.bin ? '-' + bin.bin : ''}`,
        aisle:       bin.aisle,
        zone:        bin.zone?.name,
        zoneType:    bin.zone?.type,
        capacity:    bin.capacity,
        occupied:    bin.occupied,
        available:   bin.capacity - bin.occupied,
        utilization: bin.capacity > 0 ? Math.round((bin.occupied / bin.capacity) * 100) : 0,
        temperatureZone: bin.temperatureZone,
        isHazmat:    bin.isHazmat,
        nearDispatch: bin.nearDispatch,
        nearReceiving: bin.nearReceiving,
        score:       Math.round(score),
        mapX:        bin.mapX,
        mapY:        bin.mapY,
        barcode:     bin.barcode,
      }));

    return ok(res, { criteria, recommendations: scored, product: { id: product._id, name: product.name, sku: product.sku } });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.confirmPutaway = async (req, res) => {
  try {
    const { binId, productId, quantity = 1, batchId, serialIds, warehouseUserId } = req.body;
    if (!binId || !productId) return fail(res, 'binId and productId are required');

    const bin = await StorageLocation.findById(binId);
    if (!bin || bin.isDeleted) return notFound(res, 'Bin');
    if (bin.status === 'blocked') return fail(res, 'Bin is blocked');

    const qty = Number(quantity);
    if (bin.occupied + qty > bin.capacity) return fail(res, `Bin capacity exceeded. Available: ${bin.capacity - bin.occupied}`);

    bin.occupied += qty;
    if (bin.occupied >= bin.capacity) bin.status = 'occupied';
    await bin.save();

    // Log the putaway scan
    await ScanLog.create({
      warehouseUser: warehouseUserId || req.warehouseUser?._id,
      warehouse:     bin.warehouse,
      rawValue:      bin.barcode || String(binId),
      action:        'putaway',
      scanType:      'barcode',
      resolvedEntityType: 'storage_location',
      resolvedEntityId:   bin._id,
      resolvedLabel:  `${bin.rack}-${bin.shelf}`,
      result:        'success',
      durationMs:    0,
    });

    return ok(res, { bin, qty, message: `Putaway confirmed: ${qty} unit(s) → ${bin.rack}-${bin.shelf}` });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getBinContents = async (req, res) => {
  try {
    const { binId } = req.params;
    const bin = await StorageLocation.findById(binId)
      .populate('warehouse', 'name code')
      .populate('zone', 'name type');
    if (!bin || bin.isDeleted) return notFound(res, 'Bin');

    const inventories = await Inventory.find({ storageLocation: binId, isDeleted: false })
      .populate('product', 'name sku images');

    return ok(res, { bin, inventories, utilization: bin.capacity > 0 ? Math.round((bin.occupied / bin.capacity) * 100) : 0 });
  } catch (err) {
    return serverError(res, err);
  }
};
