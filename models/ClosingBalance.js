const mongoose = require('mongoose');

const closingBalanceSchema = new mongoose.Schema({
  account:    { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  fiscalYear: { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear', required: true },
  period:     { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingPeriod' },
  debit:      { type: Number, default: 0 },
  credit:     { type: Number, default: 0 },
  balance:    { type: Number, default: 0 },
  currency:   { type: String, default: 'INR' },
  closedAt:   { type: Date, default: Date.now },
  closedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

closingBalanceSchema.index({ account: 1, fiscalYear: 1, period: 1 });

module.exports = mongoose.model('ClosingBalance', closingBalanceSchema);
