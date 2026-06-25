'use strict';
const mongoose = require('mongoose');

const financialSnapshotSchema = new mongoose.Schema({
  snapshotNumber:   { type: String, unique: true },
  snapshotType:     { type: String, enum: ['balance_sheet','pnl','cash_flow','all'], default: 'all' },
  asOfDate:         { type: Date, required: true },
  period:           { type: String, trim: true },
  fiscalYear:       { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  // Balance Sheet
  totalAssets:      { type: Number, default: 0 },
  totalLiabilities: { type: Number, default: 0 },
  totalEquity:      { type: Number, default: 0 },
  // P&L
  revenue:          { type: Number, default: 0 },
  grossProfit:      { type: Number, default: 0 },
  netProfit:        { type: Number, default: 0 },
  ebitda:           { type: Number, default: 0 },
  // Cash
  cashBalance:      { type: Number, default: 0 },
  bankBalance:      { type: Number, default: 0 },
  workingCapital:   { type: Number, default: 0 },
  receivables:      { type: Number, default: 0 },
  payables:         { type: Number, default: 0 },
  inventoryValue:   { type: Number, default: 0 },
  data:             { type: mongoose.Schema.Types.Mixed },
  generatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

financialSnapshotSchema.pre('validate', async function (next) {
  if (this.snapshotNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.snapshotNumber = `SNAP-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

financialSnapshotSchema.index({ asOfDate: -1 });
financialSnapshotSchema.index({ snapshotType: 1, period: 1 });

module.exports = mongoose.model('FinancialSnapshot', financialSnapshotSchema);
