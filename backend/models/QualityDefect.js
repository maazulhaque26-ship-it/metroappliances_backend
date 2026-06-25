'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const qualityDefectSchema = new Schema({
  defectNumber:      { type: String, unique: true },
  qualityInspection: { type: Schema.Types.ObjectId, ref: 'QualityInspection' },
  workOrder:         { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  product:           { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:       { type: String, default: '' },
  factory:           { type: Schema.Types.ObjectId, ref: 'Factory' },
  defectCode:        { type: String, default: '' },
  defectName:        { type: String, required: true },
  defectCategory:    { type: String, enum: ['dimensional','surface','functional','assembly','material','cosmetic','other'], default: 'other' },
  quantity:          { type: Number, required: true, min: 0.001 },
  unit:              { type: String, default: 'pcs' },
  severity:          { type: String, enum: ['minor','major','critical'], default: 'minor' },
  rootCause:         { type: String, default: '' },
  disposition:       { type: String, enum: ['scrap','rework','accept','pending'], default: 'pending' },
  detectedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  detectedByName:    { type: String, default: '' },
  detectedAt:        { type: Date, default: Date.now },
  capaRequired:      { type: Boolean, default: false },
  capaReference:     { type: String, default: '' },
  notes:             { type: String, default: '' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

qualityDefectSchema.index({ workOrder: 1, severity: 1 });
qualityDefectSchema.index({ factory: 1, defectCategory: 1 });
qualityDefectSchema.index({ disposition: 1 });
qualityDefectSchema.index({ detectedAt: -1 });

qualityDefectSchema.pre('validate', async function (next) {
  if (this.isNew && !this.defectNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('QualityDefect').countDocuments();
    this.defectNumber = `QD-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('QualityDefect', qualityDefectSchema);
