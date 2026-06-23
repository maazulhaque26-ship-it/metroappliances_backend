const mongoose = require('mongoose');

const generalLedgerSchema = new mongoose.Schema({
  account:       { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  journalEntry:  { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  journalLine:   { type: mongoose.Schema.Types.ObjectId, ref: 'JournalLine', required: true },
  entryDate:     { type: Date, required: true },
  fiscalYear:    { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  period:        { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingPeriod' },
  debit:         { type: Number, default: 0 },
  credit:        { type: Number, default: 0 },
  runningBalance:{ type: Number, default: 0 },
  narration:     { type: String, default: '' },
  reference:     { type: String, default: '' },
  costCenter:    { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  profitCenter:  { type: mongoose.Schema.Types.ObjectId, ref: 'ProfitCenter' },
  sourceModule:  { type: String, default: '' },
  sourceId:      { type: mongoose.Schema.Types.ObjectId },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

generalLedgerSchema.index({ account: 1, entryDate: -1 });
generalLedgerSchema.index({ journalEntry: 1 });
generalLedgerSchema.index({ fiscalYear: 1, period: 1 });

module.exports = mongoose.model('GeneralLedger', generalLedgerSchema);
