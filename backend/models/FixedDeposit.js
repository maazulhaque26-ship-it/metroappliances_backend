const mongoose = require('mongoose');

const fixedDepositSchema = new mongoose.Schema({
  fdNumber:       { type: String, unique: true },
  fdReceipt:      { type: String, trim: true },
  bankAccount:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  principalAmount:{ type: Number, required: true, min: 0 },
  interestRate:   { type: Number, required: true },
  interestType:   { type: String, enum: ['simple','compound'], default: 'compound' },
  compoundFreq:   { type: String, enum: ['monthly','quarterly','semi_annual','annual'], default: 'quarterly' },
  startDate:      { type: Date, required: true },
  maturityDate:   { type: Date, required: true },
  tenureDays:     { type: Number, default: 0 },
  maturityAmount: { type: Number, default: 0 },
  currency:       { type: String, default: 'INR', uppercase: true },
  interestAccount:{ type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  glAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  autoRenew:      { type: Boolean, default: false },
  renewalCount:   { type: Number, default: 0 },
  status:         { type: String, enum: ['active','matured','prematurely_closed','renewed'], default: 'active' },
  closedDate:     { type: Date },
  closedAmount:   { type: Number, default: 0 },
  tdsDeducted:    { type: Number, default: 0 },
  notes:          { type: String, trim: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

fixedDepositSchema.pre('validate', async function (next) {
  if (this.fdNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.fdNumber = `FD-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

fixedDepositSchema.index({ bankAccount: 1, status: 1 });
fixedDepositSchema.index({ maturityDate: 1 });

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
