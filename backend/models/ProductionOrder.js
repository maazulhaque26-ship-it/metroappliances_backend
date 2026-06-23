'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const historySchema = new Schema({
  status:       { type: String, required: true },
  note:         { type: String, default: '' },
  changedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  changedByName:{ type: String, default: '' },
  changedAt:    { type: Date, default: Date.now },
}, { _id: false });

const rawMaterialSchema = new Schema({
  product:     { type: Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, default: '' },
  planned:     { type: Number, default: 0 },
  consumed:    { type: Number, default: 0 },
  unit:        { type: String, default: 'pcs' },
}, { _id: false });

const productionOrderSchema = new Schema({
  orderNumber:  { type: String, unique: true },
  product:      { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:  { type: String, required: true, trim: true },
  bom:          { type: Schema.Types.ObjectId, ref: 'BillOfMaterials' },
  factory:      { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  workCenter:   { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  shift:        { type: Schema.Types.ObjectId, ref: 'Shift' },
  targetWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },

  plannedQuantity:   { type: Number, required: true, min: 1 },
  completedQuantity: { type: Number, default: 0, min: 0 },
  rejectedQuantity:  { type: Number, default: 0, min: 0 },
  unit:              { type: String, default: 'pcs' },

  status:   { type: String, enum: ['draft', 'confirmed', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled'], default: 'draft' },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },

  plannedStartDate: { type: Date },
  plannedEndDate:   { type: Date },
  actualStartDate:  { type: Date },
  actualEndDate:    { type: Date },

  rawMaterials:  [rawMaterialSchema],
  estimatedCost: { type: Number, default: 0 },
  actualCost:    { type: Number, default: 0 },
  oeeScore:      { type: Number, default: 0, min: 0, max: 100 },

  history:   [historySchema],
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, toObject: { virtuals: true } });

productionOrderSchema.virtual('completionRate').get(function () {
  if (!this.plannedQuantity) return 0;
  return Math.min(100, (this.completedQuantity / this.plannedQuantity) * 100);
});

productionOrderSchema.index({ factory: 1, status: 1 });
productionOrderSchema.index({ product: 1 });
productionOrderSchema.index({ plannedStartDate: 1 });
productionOrderSchema.index({ isDeleted: 1 });
productionOrderSchema.index({ createdAt: -1 });

productionOrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const year  = new Date().getFullYear();
    const count = await mongoose.model('ProductionOrder').countDocuments();
    this.orderNumber = `MFG-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductionOrder', productionOrderSchema);
