const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, unique: true },
  cashAccount:       { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount', required: true },
  transactionDate:   { type: Date, required: true },
  transactionType:   { type: String, required: true, enum: ['receipt','payment','transfer_in','transfer_out','adjustment'] },
  amount:            { type: Number, required: true, min: 0 },
  partyName:         { type: String, trim: true },
  partyType:         { type: String, enum: ['customer','vendor','employee','other',''], default: '' },
  narration:         { type: String, trim: true },
  referenceNumber:   { type: String, trim: true },
  status:            { type: String, enum: ['pending','completed','cancelled'], default: 'completed' },
  journalEntry:      { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

cashTransactionSchema.pre('validate', async function (next) {
  if (this.transactionNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.transactionNumber = `CTX-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

cashTransactionSchema.index({ cashAccount: 1, transactionDate: -1 });
cashTransactionSchema.index({ transactionDate: -1 });

module.exports = mongoose.model('CashTransaction', cashTransactionSchema);
