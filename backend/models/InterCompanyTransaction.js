'use strict';
const mongoose = require('mongoose');

const interCompanyTransactionSchema = new mongoose.Schema({
  txNumber:         { type: String, unique: true },
  fromCompany:      { type: mongoose.Schema.Types.ObjectId, ref: 'ConsolidationCompany', required: true },
  toCompany:        { type: mongoose.Schema.Types.ObjectId, ref: 'ConsolidationCompany', required: true },
  transactionDate:  { type: Date, required: true },
  transactionType:  { type: String, enum: ['sale','purchase','loan','dividend','management_fee','royalty','service','other'], default: 'sale' },
  amount:           { type: Number, required: true },
  currency:         { type: String, default: 'INR', uppercase: true },
  description:      { type: String, trim: true },
  status:           { type: String, enum: ['pending','matched','eliminated'], default: 'pending' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

interCompanyTransactionSchema.pre('validate', async function (next) {
  if (this.txNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.txNumber = `ICT-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

interCompanyTransactionSchema.index({ fromCompany: 1, toCompany: 1 });
interCompanyTransactionSchema.index({ transactionDate: -1 });
interCompanyTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('InterCompanyTransaction', interCompanyTransactionSchema);
