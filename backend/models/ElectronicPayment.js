const mongoose = require('mongoose');

const electronicPaymentSchema = new mongoose.Schema({
  paymentNumber:  { type: String, unique: true },
  bankAccount:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  paymentDate:    { type: Date, required: true },
  paymentMode:    { type: String, required: true, enum: ['neft','rtgs','imps','upi','card','online'] },
  amount:         { type: Number, required: true, min: 0 },
  currency:       { type: String, default: 'INR', uppercase: true },
  beneficiaryName:    { type: String, required: true, trim: true },
  beneficiaryAccount: { type: String, trim: true },
  beneficiaryBank:    { type: String, trim: true },
  beneficiaryIfsc:    { type: String, trim: true, uppercase: true },
  upiId:          { type: String, trim: true },
  transactionId:  { type: String, trim: true },
  rrn:            { type: String, trim: true },
  narration:      { type: String, trim: true },
  status:         { type: String, enum: ['initiated','pending','completed','failed','refunded'], default: 'initiated' },
  failureReason:  { type: String, trim: true },
  bankTransaction:{ type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' },
  journalEntry:   { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

electronicPaymentSchema.pre('validate', async function (next) {
  if (this.paymentNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.paymentNumber = `EPAY-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

electronicPaymentSchema.index({ bankAccount: 1, paymentDate: -1 });
electronicPaymentSchema.index({ paymentMode: 1, status: 1 });

module.exports = mongoose.model('ElectronicPayment', electronicPaymentSchema);
