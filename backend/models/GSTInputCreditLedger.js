'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const gstInputCreditLedgerSchema = new Schema({
  entryNumber:   { type: String, unique: true },
  period:        { type: String, required: true },
  entryDate:     { type: Date,   required: true, default: Date.now },
  entryType:     { type: String, enum: ['credit','reversal','utilization','lapse','opening','closing'], required: true },
  taxHead:       { type: String, enum: ['igst','cgst','sgst','cess'], required: true },
  amount:        { type: Number, required: true, default: 0 },
  runningBalance:{ type: Number, default: 0 },
  sourceModel:   { type: String, enum: ['GSTInputCredit','GSTAdjustment','GSTSettlement','GSTReturn','JournalEntry','manual'] },
  sourceId:      { type: ObjectId },
  narration:     { type: String, trim: true },
  gstReturn:     { type: ObjectId, ref: 'GSTReturn' },
  gstInvoice:    { type: ObjectId, ref: 'GSTInvoice' },
  gstin:         { type: String, trim: true },
  fiscalYear:    { type: ObjectId, ref: 'FiscalYear' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

gstInputCreditLedgerSchema.index({ period: -1, taxHead: 1 });
gstInputCreditLedgerSchema.index({ entryDate: -1 });
gstInputCreditLedgerSchema.index({ gstin: 1, period: -1 });

gstInputCreditLedgerSchema.pre('validate', async function (next) {
  if (!this.entryNumber) {
    const yr = new Date().getFullYear();
    const prefix = `ITCL-${yr}-`;
    const count = await this.constructor.countDocuments({ entryNumber: { $regex: `^${prefix}` } });
    this.entryNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('GSTInputCreditLedger', gstInputCreditLedgerSchema);
