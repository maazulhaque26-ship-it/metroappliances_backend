'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionRequirementSchema = new Schema({
  requirementNumber: { type: String, unique: true },
  mrpRun:       { type: Schema.Types.ObjectId, ref: 'MRPRun', required: true },
  product:      { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:  { type: String, default: '' },
  productSKU:   { type: String, default: '' },
  quantity:     { type: Number, required: true, min: 0.001 },
  unit:         { type: String, default: 'pcs' },
  bom:          { type: Schema.Types.ObjectId, ref: 'BillOfMaterials' },
  factory:      { type: Schema.Types.ObjectId, ref: 'Factory' },
  startDate:    { type: Date },
  dueDate:      { type: Date },
  priority:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  source:       { type: String, enum: ['production_plan','production_order','sales_order','forecast','manual'], default: 'production_plan' },
  sourceRef:    { type: Schema.Types.ObjectId },
  estimatedDurationDays: { type: Number, default: 0, min: 0 },
  estimatedCost: { type: Number, default: 0, min: 0 },
  status:       { type: String, enum: ['pending','scheduled','in_progress','completed','cancelled'], default: 'pending' },
  convertedOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  shortage:     { type: Schema.Types.ObjectId, ref: 'MaterialShortage' },
  notes:        { type: String, default: '' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

productionRequirementSchema.index({ mrpRun: 1, status: 1 });
productionRequirementSchema.index({ product: 1, dueDate: 1 });
productionRequirementSchema.index({ factory: 1, startDate: 1 });

productionRequirementSchema.pre('validate', async function (next) {
  if (this.isNew && !this.requirementNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ProductionRequirement').countDocuments();
    this.requirementNumber = `PRODREQ-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductionRequirement', productionRequirementSchema);
