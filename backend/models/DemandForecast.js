'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const demandForecastSchema = new Schema({
  product:       { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:   { type: String, default: '' },
  productSKU:    { type: String, default: '' },
  factory:       { type: Schema.Types.ObjectId, ref: 'Factory' },
  forecastPeriod:{ type: String, enum: ['weekly','monthly','quarterly'], default: 'monthly' },
  periodStart:   { type: Date, required: true },
  periodEnd:     { type: Date, required: true },
  forecastQty:   { type: Number, required: true, min: 0 },
  actualQty:     { type: Number, default: 0, min: 0 },
  accuracy:      { type: Number, default: 0, min: 0, max: 100 },
  method:        { type: String, enum: ['manual','moving_average','exponential_smoothing','historical'], default: 'manual' },
  confidenceLevel: { type: Number, default: 80, min: 0, max: 100 },
  unit:          { type: String, default: 'pcs' },
  source:        { type: String, enum: ['sales_history','production_plan','market_analysis','manual'], default: 'manual' },
  approvedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:{ type: String, default: '' },
  isApproved:    { type: Boolean, default: false },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

demandForecastSchema.index({ product: 1, periodStart: 1 });
demandForecastSchema.index({ factory: 1, periodStart: 1 });
demandForecastSchema.index({ forecastPeriod: 1, isApproved: 1 });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);
