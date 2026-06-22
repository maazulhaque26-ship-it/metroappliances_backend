'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const billOfMaterialsSchema = new Schema({
  bomNumber:   { type: String, unique: true },
  product:     { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true, trim: true },
  productSKU:  { type: String, default: '' },
  version:     { type: String, default: '1.0' },
  revision:    { type: Number, default: 1 },
  items:       [{ type: Schema.Types.ObjectId, ref: 'BOMItem' }],
  estimatedCostPerUnit: { type: Number, default: 0 },
  status:      { type: String, enum: ['draft', 'approved', 'active', 'obsolete'], default: 'draft' },
  approvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },
  effectiveFrom: { type: Date },
  effectiveTo:   { type: Date },
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

billOfMaterialsSchema.index({ product: 1, isDeleted: 1 });
billOfMaterialsSchema.index({ status: 1 });
billOfMaterialsSchema.index({ createdAt: -1 });

billOfMaterialsSchema.pre('save', async function (next) {
  if (this.isNew && !this.bomNumber) {
    const year  = new Date().getFullYear();
    const count = await mongoose.model('BillOfMaterials').countDocuments();
    this.bomNumber = `BOM-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BillOfMaterials', billOfMaterialsSchema);
