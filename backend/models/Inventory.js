const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const inventorySchema = new Schema({
  product:         { type: ObjectId, ref: 'Product', required: true },
  warehouse:       { type: ObjectId, ref: 'Warehouse', required: true },
  zone:            { type: ObjectId, ref: 'WarehouseZone' },
  storageLocation: { type: ObjectId, ref: 'StorageLocation' },

  // Stock quantities
  availableQty: { type: Number, default: 0, min: 0 },
  reservedQty:  { type: Number, default: 0, min: 0 },
  damagedQty:   { type: Number, default: 0, min: 0 },
  incomingQty:  { type: Number, default: 0, min: 0 },

  // Thresholds
  safetyStock:  { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  reorderQty:   { type: Number, default: 0 },

  // Valuation
  averageCost:     { type: Number, default: 0 },
  lastPurchaseCost:{ type: Number, default: 0 },

  lastUpdated: { type: Date, default: Date.now },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

inventorySchema.index({ product: 1, warehouse: 1, isDeleted: 1 });
inventorySchema.index({ warehouse: 1, isDeleted: 1 });
inventorySchema.index({ product: 1, isDeleted: 1 });
inventorySchema.index({ warehouse: 1, availableQty: 1, isDeleted: 1 });
inventorySchema.index({ storageLocation: 1, isDeleted: 1 });
inventorySchema.index({ createdAt: -1 });

// Total on-hand (available + reserved)
inventorySchema.virtual('totalQty').get(function () {
  return this.availableQty + this.reservedQty;
});

module.exports = mongoose.model('Inventory', inventorySchema);
