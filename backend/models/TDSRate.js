'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const tdsRateSchema = new Schema({
  tdsSection:    { type: ObjectId, ref: 'TDSSection', required: true },
  section:       { type: String, required: true, trim: true },
  payeeType:     { type: String, enum: ['individual','huf','company','partnership','firm','cooperative','trust','foreignCompany','other'], default: 'company' },
  rate:          { type: Number, required: true, min: 0, max: 100 },
  surchargeRate: { type: Number, default: 0 },
  cessRate:      { type: Number, default: 0 },
  effectiveRate: { type: Number, default: 0 },
  noPanRate:     { type: Number, default: 20 },
  effectiveFrom: { type: Date, required: true, default: Date.now },
  effectiveTo:   { type: Date },
  assessmentYear:{ type: String, trim: true },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

tdsRateSchema.index({ tdsSection: 1, effectiveFrom: -1 });
tdsRateSchema.index({ section: 1, isActive: 1 });

tdsRateSchema.pre('save', async function (next) {
  this.effectiveRate = (this.rate || 0) + (this.surchargeRate || 0) + (this.cessRate || 0);
  next();
});

module.exports = mongoose.model('TDSRate', tdsRateSchema);
