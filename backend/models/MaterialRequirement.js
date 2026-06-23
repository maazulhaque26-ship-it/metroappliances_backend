'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const materialRequirementSchema = new Schema({
  requirementNumber: { type: String, unique: true },
  mrpRun:           { type: Schema.Types.ObjectId, ref: 'MRPRun', required: true },
  finishedProduct:  { type: Schema.Types.ObjectId, ref: 'Product' },
  productionOrder:  { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  productionPlan:   { type: Schema.Types.ObjectId, ref: 'ProductionPlan' },
  material:         { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  materialName:     { type: String, default: '' },
  materialSKU:      { type: String, default: '' },
  unit:             { type: String, default: 'pcs' },
  // Quantities
  grossRequirement: { type: Number, default: 0, min: 0 },
  availableQty:     { type: Number, default: 0, min: 0 },
  reservedQty:      { type: Number, default: 0, min: 0 },
  incomingPOQty:    { type: Number, default: 0, min: 0 },
  incomingProdQty:  { type: Number, default: 0, min: 0 },
  netRequirement:   { type: Number, default: 0 },
  shortageQty:      { type: Number, default: 0, min: 0 },
  // BOM context
  bomLevel:         { type: Number, default: 1, min: 1, max: 10 },
  wasteAllowance:   { type: Number, default: 0, min: 0, max: 100 },
  requiredDate:     { type: Date },
  status:           { type: String, enum: ['open','partially_fulfilled','fulfilled','shortage'], default: 'open' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

materialRequirementSchema.index({ mrpRun: 1, material: 1 });
materialRequirementSchema.index({ mrpRun: 1, status: 1 });
materialRequirementSchema.index({ material: 1, requiredDate: 1 });

materialRequirementSchema.pre('validate', async function (next) {
  if (this.isNew && !this.requirementNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaterialRequirement').countDocuments();
    this.requirementNumber = `MRQ-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaterialRequirement', materialRequirementSchema);
