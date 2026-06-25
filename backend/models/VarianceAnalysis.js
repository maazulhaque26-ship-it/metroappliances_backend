'use strict';
const mongoose = require('mongoose');

const varianceAnalysisSchema = new mongoose.Schema({
  analysisNumber:        { type: String, unique: true },
  analysisType:          { type: String, enum: ['budget_vs_actual','forecast_vs_actual','period_vs_period','yoy'], default: 'budget_vs_actual' },
  period:                { type: String, required: true, trim: true },
  department:            { type: String, trim: true },
  budget:                { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  forecast:              { type: mongoose.Schema.Types.ObjectId, ref: 'FinancialForecast' },
  // Revenue
  budgetRevenue:         { type: Number, default: 0 },
  actualRevenue:         { type: Number, default: 0 },
  revenueVariance:       { type: Number, default: 0 },
  revenueVariancePct:    { type: Number, default: 0 },
  // Expenses
  budgetExpenses:        { type: Number, default: 0 },
  actualExpenses:        { type: Number, default: 0 },
  expenseVariance:       { type: Number, default: 0 },
  expenseVariancePct:    { type: Number, default: 0 },
  // Gross Margin
  budgetMargin:          { type: Number, default: 0 },
  actualMargin:          { type: Number, default: 0 },
  marginVariance:        { type: Number, default: 0 },
  marginVariancePct:     { type: Number, default: 0 },
  // Net Profit
  budgetNetProfit:       { type: Number, default: 0 },
  actualNetProfit:       { type: Number, default: 0 },
  netProfitVariance:     { type: Number, default: 0 },
  netProfitVariancePct:  { type: Number, default: 0 },
  overallStatus:         { type: String, enum: ['favorable','unfavorable','on_track'], default: 'on_track' },
  notes:                 { type: String, trim: true },
  isDeleted:             { type: Boolean, default: false },
}, { timestamps: true });

varianceAnalysisSchema.pre('validate', async function (next) {
  if (this.analysisNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.analysisNumber = `VAR-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

varianceAnalysisSchema.index({ analysisType: 1, period: 1 });
varianceAnalysisSchema.index({ department: 1, period: 1 });

module.exports = mongoose.model('VarianceAnalysis', varianceAnalysisSchema);
