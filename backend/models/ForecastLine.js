'use strict';
const mongoose = require('mongoose');

const forecastLineSchema = new mongoose.Schema({
  forecast:      { type: mongoose.Schema.Types.ObjectId, ref: 'FinancialForecast', required: true },
  account:       { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  accountCode:   { type: String, trim: true },
  accountName:   { type: String, trim: true },
  category:      { type: String, enum: ['revenue','cogs','opex','capex','other'], default: 'opex' },
  period:        { type: String, required: true, trim: true },
  forecastAmount:{ type: Number, default: 0 },
  actualAmount:  { type: Number, default: 0 },
  variance:      { type: Number, default: 0 },
  variancePct:   { type: Number, default: 0 },
  notes:         { type: String, trim: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

forecastLineSchema.index({ forecast: 1, period: 1 });
forecastLineSchema.index({ forecast: 1, category: 1 });

module.exports = mongoose.model('ForecastLine', forecastLineSchema);
