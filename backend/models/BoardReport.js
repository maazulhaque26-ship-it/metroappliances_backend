'use strict';
const mongoose = require('mongoose');

const boardReportSchema = new mongoose.Schema({
  reportNumber:      { type: String, unique: true },
  reportTitle:       { type: String, required: true, trim: true },
  boardDate:         { type: Date, required: true },
  period:            { type: String, trim: true },
  fiscalYear:        { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  summary:           { type: String, trim: true },
  keyHighlights:     [{ type: String }],
  keyRisks:          [{ type: String }],
  keyOpportunities:  [{ type: String }],
  // Financials
  revenue:           { type: Number, default: 0 },
  grossProfit:       { type: Number, default: 0 },
  netProfit:         { type: Number, default: 0 },
  ebitda:            { type: Number, default: 0 },
  cashPosition:      { type: Number, default: 0 },
  workingCapital:    { type: Number, default: 0 },
  // vs Budget
  revenueVsBudget:   { type: Number, default: 0 },
  profitVsBudget:    { type: Number, default: 0 },
  // vs Prior Year
  revenueYoY:        { type: Number, default: 0 },
  profitYoY:         { type: Number, default: 0 },
  status:            { type: String, enum: ['draft','review','approved','published'], default: 'draft' },
  preparedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:        { type: Date },
  data:              { type: mongoose.Schema.Types.Mixed },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

boardReportSchema.pre('validate', async function (next) {
  if (this.reportNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.reportNumber = `BOARD-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

boardReportSchema.index({ boardDate: -1 });
boardReportSchema.index({ status: 1 });

module.exports = mongoose.model('BoardReport', boardReportSchema);
