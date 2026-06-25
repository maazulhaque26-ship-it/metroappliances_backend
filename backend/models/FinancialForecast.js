'use strict';
const mongoose = require('mongoose');

const financialForecastSchema = new mongoose.Schema({
  forecastNumber:  { type: String, unique: true },
  forecastName:    { type: String, required: true, trim: true },
  forecastType:    { type: String, enum: ['rolling_12','annual','quarterly','monthly'], default: 'rolling_12' },
  scenario:        { type: String, enum: ['best_case','expected','worst_case'], default: 'expected' },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date },
  currency:        { type: String, default: 'INR', uppercase: true },
  totalRevenue:    { type: Number, default: 0 },
  totalExpenses:   { type: Number, default: 0 },
  grossProfit:     { type: Number, default: 0 },
  netProfit:       { type: Number, default: 0 },
  ebitda:          { type: Number, default: 0 },
  operatingCashFlow: { type: Number, default: 0 },
  status:          { type: String, enum: ['draft','approved'], default: 'draft' },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  notes:           { type: String, trim: true },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

financialForecastSchema.pre('validate', async function (next) {
  if (this.forecastNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.forecastNumber = `FFCST-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

financialForecastSchema.index({ scenario: 1, status: 1 });
financialForecastSchema.index({ startDate: -1 });

module.exports = mongoose.model('FinancialForecast', financialForecastSchema);
