'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const inventoryProjectionSchema = new Schema({
  mrpRun:        { type: Schema.Types.ObjectId, ref: 'MRPRun', required: true },
  material:      { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  materialName:  { type: String, default: '' },
  materialSKU:   { type: String, default: '' },
  warehouse:     { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  projectionDate:{ type: Date, required: true },
  openingQty:    { type: Number, default: 0, min: 0 },
  expectedIn:    { type: Number, default: 0, min: 0 },
  expectedOut:   { type: Number, default: 0, min: 0 },
  reservedQty:   { type: Number, default: 0, min: 0 },
  projectedQty:  { type: Number, default: 0 },
  safetyStock:   { type: Number, default: 0, min: 0 },
  reorderPoint:  { type: Number, default: 0, min: 0 },
  isBelowSafety: { type: Boolean, default: false },
  isBelowReorder:{ type: Boolean, default: false },
  unit:          { type: String, default: 'pcs' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

inventoryProjectionSchema.index({ mrpRun: 1, material: 1, projectionDate: 1 });
inventoryProjectionSchema.index({ material: 1, projectionDate: 1 });
inventoryProjectionSchema.index({ mrpRun: 1, isBelowSafety: 1 });

module.exports = mongoose.model('InventoryProjection', inventoryProjectionSchema);
