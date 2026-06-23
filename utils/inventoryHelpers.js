const Inventory        = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const StorageLocation  = require('../models/StorageLocation');
const Warehouse        = require('../models/Warehouse');

/**
 * Core inventory adjustment engine — single source of truth.
 * Every stock movement must go through this function.
 * Creates/updates the Inventory record and InventoryTransaction atomically.
 *
 * field: which qty field to update (default 'availableQty').
 *        Use 'damagedQty' for damage, 'reservedQty' for reservations.
 */
exports.adjustInventory = async ({
  productId,
  warehouse,
  zone            = null,
  storageLocation = null,
  quantity,                     // positive = add, negative = remove
  type,                         // InventoryTransaction.type enum
  field           = 'availableQty',
  unitCost        = 0,
  referenceType   = null,
  referenceId     = null,
  referenceNumber = null,
  performedById   = null,
  performedByName = '',
  performedByType = 'admin',
  notes           = '',
}) => {
  // Find or create Inventory record for this product+warehouse combo
  let filter = { product: productId, warehouse, isDeleted: false };
  if (storageLocation) filter.storageLocation = storageLocation;

  let inv = await Inventory.findOne(filter);
  if (!inv) {
    inv = new Inventory({ product: productId, warehouse, zone, storageLocation });
  }

  const previousQty = Number(inv[field]) || 0;
  const newQty      = Math.max(0, previousQty + quantity);
  inv[field]        = newQty;
  inv.lastUpdated   = new Date();
  if (zone && !inv.zone)                       inv.zone            = zone;
  if (storageLocation && !inv.storageLocation) inv.storageLocation = storageLocation;

  // Moving average cost update for inbound purchase
  if (type === 'purchase' && quantity > 0 && unitCost > 0) {
    const prevValue  = (inv.availableQty || 0) * (inv.averageCost || 0);
    const inValue    = quantity * unitCost;
    const totalUnits = (inv.availableQty || 0) + quantity;
    inv.averageCost      = totalUnits > 0 ? Number(((prevValue + inValue) / totalUnits).toFixed(4)) : unitCost;
    inv.lastPurchaseCost = unitCost;
  }

  await inv.save();

  // Transaction record
  const txn = await InventoryTransaction.create({
    type,
    inventory:       inv._id,
    product:         productId,
    warehouse,
    zone,
    storageLocation,
    quantity,
    previousQty,
    newQty,
    unitCost,
    referenceType,
    referenceId,
    referenceNumber,
    performedBy:     performedById,
    performedByName,
    performedByType,
    notes,
  });

  // Keep StorageLocation.occupied in sync
  if (storageLocation && quantity !== 0) {
    await StorageLocation.findByIdAndUpdate(storageLocation, [
      {
        $set: {
          occupied: { $max: [0, { $add: ['$occupied', quantity] }] },
        },
      },
    ]);
  }

  // Keep Warehouse.usedCapacity in sync
  if (warehouse && quantity !== 0 &&
      ['purchase', 'sale', 'transfer', 'adjustment', 'damage', 'return'].includes(type)) {
    await Warehouse.findByIdAndUpdate(warehouse, [
      {
        $set: {
          usedCapacity: { $max: [0, { $add: ['$usedCapacity', quantity] }] },
        },
      },
    ]);
  }

  return { inventory: inv, transaction: txn };
};

/** Auto-number generators */
const pad = (n, len = 4) => String(n).padStart(len, '0');

const datePart = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
};

exports.generateGRNNumber = async () => {
  const GRN    = require('../models/GRN');
  const prefix = `GRN-${datePart()}-`;
  const count  = await GRN.countDocuments({ grnNumber: new RegExp(`^${prefix.replace(/-/g, '\\-')}`) });
  return `${prefix}${pad(count + 1)}`;
};

exports.generateAdjNumber = async () => {
  const StockAdjustment = require('../models/StockAdjustment');
  const prefix = `ADJ-${datePart()}-`;
  const count  = await StockAdjustment.countDocuments({ adjustmentNumber: new RegExp(`^${prefix.replace(/-/g, '\\-')}`) });
  return `${prefix}${pad(count + 1)}`;
};

exports.generateCCNumber = async () => {
  const CycleCount = require('../models/CycleCount');
  const prefix = `CC-${datePart()}-`;
  const count  = await CycleCount.countDocuments({ countNumber: new RegExp(`^${prefix.replace(/-/g, '\\-')}`) });
  return `${prefix}${pad(count + 1)}`;
};
