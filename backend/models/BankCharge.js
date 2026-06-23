const mongoose = require('mongoose');

const bankChargeSchema = new mongoose.Schema({
  chargeNumber:  { type: String, unique: true },
  bankAccount:   { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  chargeDate:    { type: Date, required: true },
  chargeType:    { type: String, required: true, enum: ['service_charge','dd_commission','neft_charge','rtgs_charge','locker_rent','annual_fee','transaction_fee','forex_charge','other'] },
  amount:        { type: Number, required: true, min: 0 },
  gstAmount:     { type: Number, default: 0 },
  totalAmount:   { type: Number, default: 0 },
  narration:     { type: String, trim: true },
  referenceNo:   { type: String, trim: true },
  glAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  journalEntry:  { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  bankTransaction:{ type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

bankChargeSchema.pre('validate', async function (next) {
  if (this.chargeNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.chargeNumber = `BCH-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

bankChargeSchema.index({ bankAccount: 1, chargeDate: -1 });

module.exports = mongoose.model('BankCharge', bankChargeSchema);
