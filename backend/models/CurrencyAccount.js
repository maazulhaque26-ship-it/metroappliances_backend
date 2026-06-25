const mongoose = require('mongoose');

const currencyAccountSchema = new mongoose.Schema({
  accountNumber:  { type: String, unique: true },
  accountName:    { type: String, required: true, trim: true },
  currency:       { type: String, required: true, uppercase: true, trim: true },
  bankAccount:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  openingRate:    { type: Number, default: 1 },
  currentRate:    { type: Number, default: 1 },
  openingBalanceINR: { type: Number, default: 0 },
  currentBalanceINR: { type: Number, default: 0 },
  unrealizedGainLoss:{ type: Number, default: 0 },
  glAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isActive:       { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

currencyAccountSchema.pre('validate', async function (next) {
  if (this.accountNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.accountNumber = `FACC-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

currencyAccountSchema.index({ currency: 1, isActive: 1 });

module.exports = mongoose.model('CurrencyAccount', currencyAccountSchema);
