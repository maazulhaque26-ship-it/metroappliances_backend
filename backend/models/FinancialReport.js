'use strict';
const mongoose = require('mongoose');

const financialReportSchema = new mongoose.Schema({
  reportNumber:        { type: String, unique: true },
  reportName:          { type: String, required: true, trim: true },
  reportType:          { type: String, enum: ['balance_sheet','pnl','cash_flow','trial_balance','budget_variance','forecast_variance','profitability','executive_board','monthly_pack','custom'], required: true },
  period:              { type: String, trim: true },
  fiscalYear:          { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  fromDate:            { type: Date },
  toDate:              { type: Date },
  consolidationGroup:  { type: mongoose.Schema.Types.ObjectId, ref: 'ConsolidationGroup' },
  status:              { type: String, enum: ['draft','generated','approved','published'], default: 'draft' },
  data:                { type: mongoose.Schema.Types.Mixed },
  generatedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:          { type: Date },
  notes:               { type: String, trim: true },
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

financialReportSchema.pre('validate', async function (next) {
  if (this.reportNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.reportNumber = `RPT-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

financialReportSchema.index({ reportType: 1, period: 1 });
financialReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('FinancialReport', financialReportSchema);
