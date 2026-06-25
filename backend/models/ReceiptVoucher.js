const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const receiptVoucherSchema = new Schema({
  voucherNumber:   { type: String, unique: true },
  customer:        { type: ObjectId, ref: 'User', required: true },
  customerName:    { type: String, trim: true },
  customerReceipt: { type: ObjectId, ref: 'CustomerReceipt' },
  voucherDate:     { type: Date, required: true, default: Date.now },
  amount:          { type: Number, required: true, min: 0 },
  narration:       { type: String, trim: true },
  debitAccount:    { type: ObjectId, ref: 'ChartOfAccount' },
  creditAccount:   { type: ObjectId, ref: 'ChartOfAccount' },
  costCenter:      { type: ObjectId, ref: 'CostCenter' },
  status:          { type: String, enum: ['draft','posted','cancelled'], default: 'draft' },
  journalEntry:    { type: ObjectId, ref: 'JournalEntry' },
  glPosted:        { type: Boolean, default: false },
  createdBy:       { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

receiptVoucherSchema.index({ customer: 1, isDeleted: 1 });
receiptVoucherSchema.index({ voucherDate: -1 });
receiptVoucherSchema.index({ customerReceipt: 1 });

receiptVoucherSchema.pre('validate', async function (next) {
  if (!this.voucherNumber) {
    const yr = new Date().getFullYear();
    const prefix = `RV-${yr}-`;
    const count = await this.constructor.countDocuments({ voucherNumber: { $regex: `^${prefix}` } });
    this.voucherNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ReceiptVoucher', receiptVoucherSchema);
