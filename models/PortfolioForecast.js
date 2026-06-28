'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioForecastSchema = new Schema({
  portfolio:     { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  period:        { type: String, required: true },
  periodType:    { type: String, enum: ['month','quarter','year'], default: 'month' },
  plannedCost:   { type: Number, default: 0 },
  forecastCost:  { type: Number, default: 0 },
  actualCost:    { type: Number, default: 0 },
  plannedBenefit:{ type: Number, default: 0 },
  forecastBenefit:{ type: Number, default: 0 },
  actualBenefit: { type: Number, default: 0 },
  currency:      { type: String, default: 'INR' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

portfolioForecastSchema.index({ portfolio: 1, period: 1 });

module.exports = mongoose.model('PortfolioForecast', portfolioForecastSchema);
