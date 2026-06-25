'use strict';
const mongoose = require('mongoose');

const financialKPISchema = new mongoose.Schema({
  kpiCode:           { type: String, unique: true },
  period:            { type: String, required: true, trim: true },
  fiscalYear:        { type: String, trim: true },
  // Profitability
  revenue:           { type: Number, default: 0 },
  cogs:              { type: Number, default: 0 },
  grossProfit:       { type: Number, default: 0 },
  netProfit:         { type: Number, default: 0 },
  ebit:              { type: Number, default: 0 },
  ebitda:            { type: Number, default: 0 },
  operatingMargin:   { type: Number, default: 0 },
  grossMargin:       { type: Number, default: 0 },
  netMargin:         { type: Number, default: 0 },
  // Liquidity
  currentAssets:     { type: Number, default: 0 },
  currentLiabilities:{ type: Number, default: 0 },
  quickAssets:       { type: Number, default: 0 },
  currentRatio:      { type: Number, default: 0 },
  quickRatio:        { type: Number, default: 0 },
  workingCapital:    { type: Number, default: 0 },
  // Efficiency
  dso:               { type: Number, default: 0 },
  dpo:               { type: Number, default: 0 },
  inventoryTurnover: { type: Number, default: 0 },
  cashConversionCycle: { type: Number, default: 0 },
  // Returns
  totalAssets:       { type: Number, default: 0 },
  totalEquity:       { type: Number, default: 0 },
  totalDebt:         { type: Number, default: 0 },
  roa:               { type: Number, default: 0 },
  roe:               { type: Number, default: 0 },
  roi:               { type: Number, default: 0 },
  debtRatio:         { type: Number, default: 0 },
  // Cash
  cashBalance:       { type: Number, default: 0 },
  freeCashFlow:      { type: Number, default: 0 },
  calculatedAt:      { type: Date, default: Date.now },
  notes:             { type: String, trim: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

financialKPISchema.pre('validate', async function (next) {
  if (this.kpiCode) return next();
  const count = await this.constructor.countDocuments();
  this.kpiCode = `KPI-${String(count + 1).padStart(6, '0')}`;
  next();
});

financialKPISchema.index({ period: 1 });
financialKPISchema.index({ calculatedAt: -1 });

module.exports = mongoose.model('FinancialKPI', financialKPISchema);
