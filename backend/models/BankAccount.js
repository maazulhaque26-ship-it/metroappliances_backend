const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  accountNumber:  { type: String, required: true, unique: true, trim: true },
  accountName:    { type: String, required: true, trim: true },
  bank:           { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
  branch:         { type: mongoose.Schema.Types.ObjectId, ref: 'BankBranch' },
  bankName:       { type: String, trim: true },
  ifscCode:       { type: String, trim: true, uppercase: true },
  accountType:    { type: String, enum: ['savings','current','overdraft','cash_credit','fixed_deposit','nre','nro'], default: 'current' },
  currency:       { type: String, default: 'INR', uppercase: true },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  overdraftLimit: { type: Number, default: 0 },
  glAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isPrimary:      { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },
  notes:          { type: String, trim: true },
}, { timestamps: true });

bankAccountSchema.index({ bank: 1, isDeleted: 1 });
bankAccountSchema.index({ currency: 1, isActive: 1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
