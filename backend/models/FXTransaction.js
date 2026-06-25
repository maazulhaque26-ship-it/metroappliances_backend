const mongoose = require('mongoose');

const fxTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, unique: true },
  transactionDate:   { type: Date, required: true },
  transactionType:   { type: String, required: true, enum: ['buy','sell','swap','forward','spot','revaluation'] },
  fromCurrency:      { type: String, required: true, uppercase: true, trim: true },
  toCurrency:        { type: String, required: true, uppercase: true, trim: true },
  fromAmount:        { type: Number, required: true, min: 0 },
  toAmount:          { type: Number, default: 0 },
  exchangeRate:      { type: Number, required: true, min: 0 },
  bankRate:          { type: Number, default: 0 },
  spread:            { type: Number, default: 0 },
  bankAccount:       { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  currencyAccount:   { type: mongoose.Schema.Types.ObjectId, ref: 'CurrencyAccount' },
  dealNumber:        { type: String, trim: true },
  valueDate:         { type: Date },
  maturityDate:      { type: Date },
  gainLossAmount:    { type: Number, default: 0 },
  journalEntry:      { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  status:            { type: String, enum: ['draft','confirmed','settled','cancelled'], default: 'draft' },
  notes:             { type: String, trim: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

fxTransactionSchema.pre('validate', async function (next) {
  if (this.transactionNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.transactionNumber = `FXT-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

fxTransactionSchema.index({ transactionDate: -1 });
fxTransactionSchema.index({ fromCurrency: 1, toCurrency: 1 });
fxTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('FXTransaction', fxTransactionSchema);
