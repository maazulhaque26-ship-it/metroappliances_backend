'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const gstAdjustmentSchema = new Schema({
  adjustmentNumber: { type: String, unique: true },
  adjustmentType:   { type: String, enum: ['itc_reversal','itc_claim','output_correction','credit_note','debit_note','error_correction','provisional'], required: true },
  period:           { type: String, required: true },
  gstReturn:        { type: ObjectId, ref: 'GSTReturn' },
  gstInvoice:       { type: ObjectId, ref: 'GSTInvoice' },
  reason:           { type: String, required: true, trim: true },
  igstAmount:       { type: Number, default: 0 },
  cgstAmount:       { type: Number, default: 0 },
  sgstAmount:       { type: Number, default: 0 },
  cessAmount:       { type: Number, default: 0 },
  totalAmount:      { type: Number, default: 0 },
  adjustmentDate:   { type: Date, default: Date.now },
  status:           { type: String, enum: ['draft','approved','posted','reversed'], default: 'draft' },
  approvedBy:       { type: ObjectId, ref: 'User' },
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  createdBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

gstAdjustmentSchema.index({ period: -1 });
gstAdjustmentSchema.index({ adjustmentType: 1, status: 1 });

gstAdjustmentSchema.pre('validate', async function (next) {
  if (!this.adjustmentNumber) {
    const yr = new Date().getFullYear();
    const prefix = `GSTADJ-${yr}-`;
    const count = await this.constructor.countDocuments({ adjustmentNumber: { $regex: `^${prefix}` } });
    this.adjustmentNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('GSTAdjustment', gstAdjustmentSchema);
