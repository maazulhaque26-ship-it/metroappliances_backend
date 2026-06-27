'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

// One budget record per portfolio. Cost rollup is computed from project costs
// via the finance controller; this stores the planned allocation.
const portfolioBudgetSchema = new Schema({
  portfolio:        { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, unique: true },
  fiscalYear:       { type: String, default: '' },
  totalBudget:      { type: Number, default: 0 },
  capexBudget:      { type: Number, default: 0 },
  opexBudget:       { type: Number, default: 0 },
  contingency:      { type: Number, default: 0 },
  allocatedAmount:  { type: Number, default: 0 },
  committedAmount:  { type: Number, default: 0 },
  actualSpend:      { type: Number, default: 0 },
  currency:         { type: String, default: 'INR' },
  notes:            { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PortfolioBudget', portfolioBudgetSchema);
