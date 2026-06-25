const mongoose = require('mongoose');

const cashTransferSchema = new mongoose.Schema({
  transferNumber:  { type: String, unique: true },
  transferDate:    { type: Date, required: true },
  fromAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  toAccount:       { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  fromCashAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount' },
  toCashAccount:   { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount' },
  transferType:    { type: String, enum: ['bank_to_bank','bank_to_cash','cash_to_bank','cash_to_cash'], required: true },
  amount:          { type: Number, required: true, min: 0 },
  currency:        { type: String, default: 'INR', uppercase: true },
  narration:       { type: String, trim: true },
  referenceNumber: { type: String, trim: true },
  status:          { type: String, enum: ['pending','completed','cancelled'], default: 'pending' },
  journalEntry:    { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

cashTransferSchema.pre('validate', async function (next) {
  if (this.transferNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.transferNumber = `CTRF-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

cashTransferSchema.index({ transferDate: -1 });
cashTransferSchema.index({ status: 1 });

module.exports = mongoose.model('CashTransfer', cashTransferSchema);
