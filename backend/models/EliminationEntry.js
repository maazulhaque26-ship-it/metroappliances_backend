'use strict';
const mongoose = require('mongoose');

const eliminationEntrySchema = new mongoose.Schema({
  eliminationNumber:    { type: String, unique: true },
  interCompanyTx:       { type: mongoose.Schema.Types.ObjectId, ref: 'InterCompanyTransaction' },
  consolidationGroup:   { type: mongoose.Schema.Types.ObjectId, ref: 'ConsolidationGroup', required: true },
  period:               { type: String, required: true, trim: true },
  debitAccount:         { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  creditAccount:        { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  amount:               { type: Number, required: true },
  description:          { type: String, trim: true },
  isDeleted:            { type: Boolean, default: false },
}, { timestamps: true });

eliminationEntrySchema.pre('validate', async function (next) {
  if (this.eliminationNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.eliminationNumber = `ELIM-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

eliminationEntrySchema.index({ consolidationGroup: 1, period: 1 });

module.exports = mongoose.model('EliminationEntry', eliminationEntrySchema);
