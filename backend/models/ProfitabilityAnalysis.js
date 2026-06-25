'use strict';
const mongoose = require('mongoose');

const profitabilityAnalysisSchema = new mongoose.Schema({
  analysisNumber:    { type: String, unique: true },
  analysisType:      { type: String, enum: ['product','customer','dealer','factory','warehouse','service','channel','region'], required: true },
  period:            { type: String, required: true, trim: true },
  entityId:          { type: String, trim: true },
  entityName:        { type: String, trim: true },
  revenue:           { type: Number, default: 0 },
  cogs:              { type: Number, default: 0 },
  grossProfit:       { type: Number, default: 0 },
  grossMargin:       { type: Number, default: 0 },
  directExpenses:    { type: Number, default: 0 },
  allocatedOverhead: { type: Number, default: 0 },
  totalExpenses:     { type: Number, default: 0 },
  netProfit:         { type: Number, default: 0 },
  netMargin:         { type: Number, default: 0 },
  contribution:      { type: Number, default: 0 },
  contributionMargin:{ type: Number, default: 0 },
  status:            { type: String, enum: ['draft','final'], default: 'draft' },
  notes:             { type: String, trim: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

profitabilityAnalysisSchema.pre('validate', async function (next) {
  if (this.analysisNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.analysisNumber = `PROF-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

profitabilityAnalysisSchema.index({ analysisType: 1, period: 1 });
profitabilityAnalysisSchema.index({ entityName: 1, period: 1 });

module.exports = mongoose.model('ProfitabilityAnalysis', profitabilityAnalysisSchema);
