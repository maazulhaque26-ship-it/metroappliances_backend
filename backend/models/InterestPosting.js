const mongoose = require('mongoose');

const interestPostingSchema = new mongoose.Schema({
  postingNumber:  { type: String, unique: true },
  bankAccount:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  fixedDeposit:   { type: mongoose.Schema.Types.ObjectId, ref: 'FixedDeposit' },
  postingDate:    { type: Date, required: true },
  period:         { type: String, trim: true },
  interestType:   { type: String, enum: ['credit','debit','tds','accrual'], required: true },
  principalAmount:{ type: Number, default: 0 },
  interestRate:   { type: Number, default: 0 },
  interestDays:   { type: Number, default: 0 },
  interestAmount: { type: Number, required: true, min: 0 },
  tdsAmount:      { type: Number, default: 0 },
  netInterest:    { type: Number, default: 0 },
  glAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  journalEntry:   { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  bankTransaction:{ type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

interestPostingSchema.pre('validate', async function (next) {
  if (this.postingNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.postingNumber = `IP-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

interestPostingSchema.index({ bankAccount: 1, postingDate: -1 });
interestPostingSchema.index({ postingDate: -1 });

module.exports = mongoose.model('InterestPosting', interestPostingSchema);
