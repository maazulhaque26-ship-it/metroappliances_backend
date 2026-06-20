const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const TXN_TYPES = ['purchase', 'sale', 'transfer', 'adjustment', 'damage', 'return',
                   'cycle_count', 'reservation', 'release', 'manual'];

const inventoryTransactionSchema = new Schema({
  type:            { type: String, enum: TXN_TYPES, required: true },
  inventory:       { type: ObjectId, ref: 'Inventory' },
  product:         { type: ObjectId, ref: 'Product', required: true },
  warehouse:       { type: ObjectId, ref: 'Warehouse', required: true },
  zone:            { type: ObjectId, ref: 'WarehouseZone' },
  storageLocation: { type: ObjectId, ref: 'StorageLocation' },

  quantity:    { type: Number, required: true },   // positive = in, negative = out
  previousQty: { type: Number, default: 0 },
  newQty:      { type: Number, default: 0 },
  unitCost:    { type: Number, default: 0 },

  referenceType:   { type: String, trim: true }, // 'GRN', 'Order', 'Adjustment', 'CycleCount'
  referenceId:     { type: ObjectId },
  referenceNumber: { type: String, trim: true },

  performedBy:     { type: ObjectId },
  performedByName: { type: String, trim: true },
  performedByType: { type: String, enum: ['admin', 'warehouse_user'], default: 'admin' },

  notes:     { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

inventoryTransactionSchema.index({ product: 1, warehouse: 1, createdAt: -1 });
inventoryTransactionSchema.index({ warehouse: 1, type: 1, createdAt: -1 });
inventoryTransactionSchema.index({ inventory: 1, createdAt: -1 });
inventoryTransactionSchema.index({ referenceId: 1 });
inventoryTransactionSchema.index({ createdAt: -1 });
inventoryTransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
