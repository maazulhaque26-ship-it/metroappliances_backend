const mongoose = require('mongoose');

const trialBalanceSnapshotSchema = new mongoose.Schema({
  snapshotCode: { type: String, unique: true },
  fiscalYear:   { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear', required: true },
  period:       { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingPeriod' },
  asOfDate:     { type: Date, required: true },
  totalDebit:   { type: Number, default: 0 },
  totalCredit:  { type: Number, default: 0 },
  isBalanced:   { type: Boolean, default: false },
  entries: [{
    account:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
    accountCode:  { type: String },
    accountName:  { type: String },
    accountType:  { type: String },
    debit:        { type: Number, default: 0 },
    credit:       { type: Number, default: 0 },
  }],
  generatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

trialBalanceSnapshotSchema.pre('validate', async function (next) {
  if (this.snapshotCode) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.snapshotCode = `TB-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('TrialBalanceSnapshot', trialBalanceSnapshotSchema);
