'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const taxRateSchema = new Schema({
  taxCode:       { type: ObjectId, ref: 'TaxCode', required: true },
  name:          { type: String, required: true, trim: true },
  rate:          { type: Number, required: true, min: 0, max: 100 },
  effectiveFrom: { type: Date, required: true, default: Date.now },
  effectiveTo:   { type: Date },
  cgstRate:      { type: Number, default: 0 },
  sgstRate:      { type: Number, default: 0 },
  igstRate:      { type: Number, default: 0 },
  cessRate:      { type: Number, default: 0 },
  isReverseCharge:{ type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

taxRateSchema.index({ taxCode: 1, effectiveFrom: -1 });
taxRateSchema.index({ isActive: 1 });

module.exports = mongoose.model('TaxRate', taxRateSchema);
