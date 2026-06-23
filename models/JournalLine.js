const mongoose = require('mongoose');

const journalLineSchema = new mongoose.Schema({
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  lineNumber:   { type: Number, required: true },
  account:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  debit:        { type: Number, default: 0, min: 0 },
  credit:       { type: Number, default: 0, min: 0 },
  currency:     { type: String, default: 'INR' },
  exchangeRate: { type: Number, default: 1 },
  baseDebit:    { type: Number, default: 0 },
  baseCredit:   { type: Number, default: 0 },
  narration:    { type: String, default: '' },
  costCenter:   { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  profitCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfitCenter' },
  taxCode:      { type: String, default: '' },
  taxAmount:    { type: Number, default: 0 },
  reference:    { type: String, default: '' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

journalLineSchema.index({ journalEntry: 1, lineNumber: 1 });
journalLineSchema.index({ account: 1 });

module.exports = mongoose.model('JournalLine', journalLineSchema);
