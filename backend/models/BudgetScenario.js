'use strict';
const mongoose = require('mongoose');

const budgetScenarioSchema = new mongoose.Schema({
  scenarioName:      { type: String, required: true, trim: true },
  scenarioType:      { type: String, enum: ['best_case','expected','worst_case','base'], default: 'expected' },
  fiscalYear:        { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  budget:            { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  adjustmentFactor:  { type: Number, default: 1 },
  revenueAdjPct:     { type: Number, default: 0 },
  expenseAdjPct:     { type: Number, default: 0 },
  description:       { type: String, trim: true },
  isActive:          { type: Boolean, default: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

budgetScenarioSchema.index({ budget: 1, scenarioType: 1 });

module.exports = mongoose.model('BudgetScenario', budgetScenarioSchema);
