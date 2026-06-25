'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetCategorySchema = new Schema({
  code:            { type: String, unique: true },
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  parentCategory:  { type: Schema.Types.ObjectId, ref: 'AssetCategory' },
  depreciationMethod: { type: String, enum: ['straight_line','declining_balance','sum_of_years','units_of_production'], default: 'straight_line' },
  usefulLife:      { type: Number, default: 5 },   // years
  salvageValue:    { type: Number, default: 0 },
  maintenanceFrequency: { type: Number, default: 90 },  // days
  accountCode:     { type: String, default: '' },
  isActive:        { type: Boolean, default: true },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

assetCategorySchema.index({ parentCategory: 1 });
assetCategorySchema.index({ isActive: 1 });

assetCategorySchema.pre('validate', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('AssetCategory').countDocuments();
    this.code = `AC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
