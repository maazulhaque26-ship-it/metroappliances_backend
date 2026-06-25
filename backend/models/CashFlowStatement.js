'use strict';
const mongoose = require('mongoose');

const cashFlowStatementSchema = new mongoose.Schema({
  statementNumber:       { type: String, unique: true },
  period:                { type: String, required: true, trim: true },
  fiscalYear:            { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  fromDate:              { type: Date },
  toDate:                { type: Date },
  // Operating Activities
  netIncome:             { type: Number, default: 0 },
  depreciation:          { type: Number, default: 0 },
  amortization:          { type: Number, default: 0 },
  receivablesChange:     { type: Number, default: 0 },
  inventoryChange:       { type: Number, default: 0 },
  payablesChange:        { type: Number, default: 0 },
  otherWorkingCapital:   { type: Number, default: 0 },
  operatingActivities:   { type: Number, default: 0 },
  // Investing Activities
  capex:                 { type: Number, default: 0 },
  assetSales:            { type: Number, default: 0 },
  investments:           { type: Number, default: 0 },
  investingActivities:   { type: Number, default: 0 },
  // Financing Activities
  debtBorrowed:          { type: Number, default: 0 },
  debtRepaid:            { type: Number, default: 0 },
  equityRaised:          { type: Number, default: 0 },
  dividendsPaid:         { type: Number, default: 0 },
  financingActivities:   { type: Number, default: 0 },
  // Summary
  netCashFlow:           { type: Number, default: 0 },
  openingCash:           { type: Number, default: 0 },
  closingCash:           { type: Number, default: 0 },
  freeCashFlow:          { type: Number, default: 0 },
  status:                { type: String, enum: ['draft','final'], default: 'draft' },
  notes:                 { type: String, trim: true },
  isDeleted:             { type: Boolean, default: false },
}, { timestamps: true });

cashFlowStatementSchema.pre('validate', async function (next) {
  if (this.statementNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.statementNumber = `CFS-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

cashFlowStatementSchema.index({ period: 1 });
cashFlowStatementSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CashFlowStatement', cashFlowStatementSchema);
