const mongoose = require('mongoose');

const openingBalanceSchema = new mongoose.Schema({
  account:    { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  fiscalYear: { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear', required: true },
  debit:      { type: Number, default: 0 },
  credit:     { type: Number, default: 0 },
  balance:    { type: Number, default: 0 },
  currency:   { type: String, default: 'INR' },
  isPosted:   { type: Boolean, default: false },
  postedAt:   { type: Date },
  postedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

openingBalanceSchema.index({ account: 1, fiscalYear: 1 }, { unique: true });

module.exports = mongoose.model('OpeningBalance', openingBalanceSchema);
