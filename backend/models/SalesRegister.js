const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const salesRegisterSchema = new Schema({
  registerNumber:   { type: String, unique: true },
  customerInvoice:  { type: ObjectId, ref: 'CustomerInvoice', required: true },
  customer:         { type: ObjectId, ref: 'User', required: true },
  customerName:     { type: String, trim: true },
  customerGST:      { type: String, trim: true },
  invoiceDate:      { type: Date, required: true },
  invoiceNumber:    { type: String, trim: true },
  invoiceType:      { type: String, trim: true },
  subtotal:         { type: Number, default: 0 },
  discountTotal:    { type: Number, default: 0 },
  taxableAmount:    { type: Number, default: 0 },
  igstAmount:       { type: Number, default: 0 },
  cgstAmount:       { type: Number, default: 0 },
  sgstAmount:       { type: Number, default: 0 },
  taxAmount:        { type: Number, default: 0 },
  totalAmount:      { type: Number, default: 0 },
  currency:         { type: String, default: 'INR' },
  gstCategory:      { type: String, enum: ['B2B','B2C_large','B2C_small','export','nil_rated','exempt'], default: 'B2B' },
  hsn:              { type: String, trim: true },
  placeOfSupply:    { type: String, trim: true },
  reverseCharge:    { type: Boolean, default: false },
  fiscalYear:       { type: ObjectId, ref: 'FiscalYear' },
  period:           { type: ObjectId, ref: 'AccountingPeriod' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

salesRegisterSchema.index({ customer: 1, invoiceDate: -1 });
salesRegisterSchema.index({ fiscalYear: 1, period: 1 });
salesRegisterSchema.index({ customerInvoice: 1 });

salesRegisterSchema.pre('validate', async function (next) {
  if (!this.registerNumber) {
    const yr = new Date().getFullYear();
    const prefix = `SR-${yr}-`;
    const count = await this.constructor.countDocuments({ registerNumber: { $regex: `^${prefix}` } });
    this.registerNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SalesRegister', salesRegisterSchema);
