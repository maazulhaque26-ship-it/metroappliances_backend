const mongoose = require('mongoose');

const cashAccountSchema = new mongoose.Schema({
  accountNumber:  { type: String, unique: true },
  accountName:    { type: String, required: true, trim: true },
  location:       { type: String, trim: true },
  currency:       { type: String, default: 'INR', uppercase: true },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  maxLimit:       { type: Number, default: 0 },
  glAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  custodian:      { type: String, trim: true },
  isActive:       { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

cashAccountSchema.pre('validate', async function (next) {
  if (this.accountNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.accountNumber = `CACC-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

cashAccountSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('CashAccount', cashAccountSchema);
