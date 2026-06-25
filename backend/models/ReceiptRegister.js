const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const receiptRegisterSchema = new Schema({
  registerNumber:  { type: String, unique: true },
  customerReceipt: { type: ObjectId, ref: 'CustomerReceipt', required: true },
  customer:        { type: ObjectId, ref: 'User', required: true },
  customerName:    { type: String, trim: true },
  receiptDate:     { type: Date, required: true },
  receiptNumber:   { type: String, trim: true },
  receiptType:     { type: String, trim: true },
  paymentMode:     { type: String, trim: true },
  bankName:        { type: String, trim: true },
  chequeNo:        { type: String, trim: true },
  referenceNo:     { type: String, trim: true },
  amount:          { type: Number, default: 0 },
  bankCharges:     { type: Number, default: 0 },
  netAmount:       { type: Number, default: 0 },
  currency:        { type: String, default: 'INR' },
  fiscalYear:      { type: ObjectId, ref: 'FiscalYear' },
  period:          { type: ObjectId, ref: 'AccountingPeriod' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

receiptRegisterSchema.index({ customer: 1, receiptDate: -1 });
receiptRegisterSchema.index({ fiscalYear: 1, period: 1 });
receiptRegisterSchema.index({ customerReceipt: 1 });

receiptRegisterSchema.pre('validate', async function (next) {
  if (!this.registerNumber) {
    const yr = new Date().getFullYear();
    const prefix = `RR-${yr}-`;
    const count = await this.constructor.countDocuments({ registerNumber: { $regex: `^${prefix}` } });
    this.registerNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ReceiptRegister', receiptRegisterSchema);
