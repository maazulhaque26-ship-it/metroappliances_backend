'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetDepreciationSchema = new Schema({
  asset:            { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetNumber:      { type: String, default: '' },
  assetName:        { type: String, default: '' },
  depreciationMethod: { type: String, enum: ['straight_line','declining_balance','sum_of_years','units_of_production'], required: true },
  purchaseCost:     { type: Number, required: true },
  salvageValue:     { type: Number, default: 0 },
  usefulLifeYears:  { type: Number, required: true },
  depreciationRate: { type: Number, default: 0 },  // percent per year
  // Annual schedule
  schedule: [{
    year:         Number,
    openingValue: Number,
    depreciationAmount: Number,
    closingValue: Number,
    accumulatedDepreciation: Number,
  }],
  currentBookValue: { type: Number, default: 0 },
  accumulatedDepreciation: { type: Number, default: 0 },
  depreciationStartDate: { type: Date },
  fullyDepreciatedDate:  { type: Date },
  lastCalculatedDate:    { type: Date },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

assetDepreciationSchema.index({ asset: 1 });
assetDepreciationSchema.index({ depreciationMethod: 1 });

module.exports = mongoose.model('AssetDepreciation', assetDepreciationSchema);
