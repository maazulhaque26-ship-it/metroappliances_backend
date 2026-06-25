'use strict';
const mongoose = require('mongoose');

const budgetLineSchema = new mongoose.Schema({
  budget:        { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  account:       { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  accountCode:   { type: String, trim: true },
  accountName:   { type: String, trim: true },
  category:      { type: String, enum: ['revenue','cogs','gross_profit','opex','capex','other'], default: 'opex' },
  description:   { type: String, trim: true },
  annualBudget:  { type: Number, default: 0 },
  q1Budget:      { type: Number, default: 0 },
  q2Budget:      { type: Number, default: 0 },
  q3Budget:      { type: Number, default: 0 },
  q4Budget:      { type: Number, default: 0 },
  janBudget:     { type: Number, default: 0 },
  febBudget:     { type: Number, default: 0 },
  marBudget:     { type: Number, default: 0 },
  aprBudget:     { type: Number, default: 0 },
  mayBudget:     { type: Number, default: 0 },
  junBudget:     { type: Number, default: 0 },
  julBudget:     { type: Number, default: 0 },
  augBudget:     { type: Number, default: 0 },
  sepBudget:     { type: Number, default: 0 },
  octBudget:     { type: Number, default: 0 },
  novBudget:     { type: Number, default: 0 },
  decBudget:     { type: Number, default: 0 },
  actualAmount:  { type: Number, default: 0 },
  variance:      { type: Number, default: 0 },
  variancePct:   { type: Number, default: 0 },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

budgetLineSchema.index({ budget: 1, category: 1 });
budgetLineSchema.index({ budget: 1, account: 1 });

module.exports = mongoose.model('BudgetLine', budgetLineSchema);
