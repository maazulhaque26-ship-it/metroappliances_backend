'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const tdsSectionSchema = new Schema({
  section:       { type: String, required: true, unique: true, trim: true },
  description:   { type: String, required: true, trim: true },
  natureOfPayment:{ type: String, required: true, trim: true },
  thresholdLimit:{ type: Number, default: 0 },
  individualRate:{ type: Number, default: 0, min: 0, max: 100 },
  companyRate:   { type: Number, default: 0, min: 0, max: 100 },
  surchargeApplicable: { type: Boolean, default: false },
  cessApplicable:{ type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

tdsSectionSchema.index({ isActive: 1 });

module.exports = mongoose.model('TDSSection', tdsSectionSchema);
