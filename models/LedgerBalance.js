const mongoose = require('mongoose');

const ledgerBalanceSchema = new mongoose.Schema({
  account:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  fiscalYear:   { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear', required: true },
  period:       { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingPeriod' },
  openingDebit: { type: Number, default: 0 },
  openingCredit:{ type: Number, default: 0 },
  periodDebit:  { type: Number, default: 0 },
  periodCredit: { type: Number, default: 0 },
  closingDebit: { type: Number, default: 0 },
  closingCredit:{ type: Number, default: 0 },
  balance:      { type: Number, default: 0 },
  currency:     { type: String, default: 'INR' },
  lastUpdated:  { type: Date, default: Date.now },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

ledgerBalanceSchema.index({ account: 1, fiscalYear: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('LedgerBalance', ledgerBalanceSchema);
