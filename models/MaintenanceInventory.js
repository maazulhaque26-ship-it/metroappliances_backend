'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceInventorySchema = new Schema({
  transactionNumber: { type: String, unique: true },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder', required: true },
  workOrderNumber:   { type: String, default: '' },
  asset:             { type: Schema.Types.ObjectId, ref: 'Asset' },
  assetName:         { type: String, default: '' },
  transactionType:   { type: String, enum: ['issue','return','reservation','consumption'], required: true },
  // Part details — references existing SparePart model
  sparePart:         { type: Schema.Types.ObjectId, ref: 'SparePart' },
  partName:          { type: String, required: true },
  partNumber:        { type: String, default: '' },
  quantity:          { type: Number, required: true, min: 0.001 },
  unit:              { type: String, default: 'pcs' },
  unitCost:          { type: Number, default: 0 },
  totalCost:         { type: Number, default: 0 },
  warehouse:         { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouseName:     { type: String, default: '' },
  storageLocation:   { type: Schema.Types.ObjectId, ref: 'StorageLocation' },
  // Inventory adjustment reference
  inventoryTransaction: { type: Schema.Types.ObjectId, ref: 'InventoryTransaction' },
  performedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  performedByName:   { type: String, default: '' },
  transactionDate:   { type: Date, default: Date.now },
  notes:             { type: String, default: '' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

maintenanceInventorySchema.index({ maintenanceWorkOrder: 1 });
maintenanceInventorySchema.index({ sparePart: 1, transactionType: 1 });
maintenanceInventorySchema.index({ transactionDate: -1 });

maintenanceInventorySchema.pre('validate', async function (next) {
  if (this.isNew && !this.transactionNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceInventory').countDocuments();
    this.transactionNumber = `MIT-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceInventory', maintenanceInventorySchema);
