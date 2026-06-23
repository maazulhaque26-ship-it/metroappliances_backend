const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, unique: true },
  bankAccount:       { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  transactionDate:   { type: Date, required: true },
  valueDate:         { type: Date },
  transactionType:   { type: String, required: true, enum: ['receipt','payment','transfer_in','transfer_out','bank_charge','interest_credit','interest_debit','cash_deposit','cash_withdrawal','opening_balance','adjustment'] },
  paymentMode:       { type: String, enum: ['cash','cheque','demand_draft','neft','rtgs','imps','upi','card','online','internal','other'], default: 'other' },
  amount:            { type: Number, required: true, min: 0 },
  currency:          { type: String, default: 'INR', uppercase: true },
  exchangeRate:      { type: Number, default: 1 },
  amountINR:         { type: Number, default: 0 },
  partyType:         { type: String, enum: ['customer','vendor','dealer','employee','bank','other',''] , default: '' },
  partyName:         { type: String, trim: true },
  partyReference:    { type: String, trim: true },
  chequeNumber:      { type: String, trim: true },
  chequeDate:        { type: Date },
  referenceNumber:   { type: String, trim: true },
  narration:         { type: String, trim: true },
  status:            { type: String, enum: ['pending','cleared','bounced','cancelled','reconciled'], default: 'pending' },
  isReconciled:      { type: Boolean, default: false },
  reconciledOn:      { type: Date },
  journalEntry:      { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  sourceModule:      { type: String, default: '' },
  sourceId:          { type: mongoose.Schema.Types.ObjectId },
  bankStatementLine: { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatementLine' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

bankTransactionSchema.pre('validate', async function (next) {
  if (this.transactionNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.transactionNumber = `BTX-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

bankTransactionSchema.index({ bankAccount: 1, transactionDate: -1 });
bankTransactionSchema.index({ status: 1, isReconciled: 1 });
bankTransactionSchema.index({ transactionDate: -1 });

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);
