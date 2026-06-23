const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const paymentAllocationSchema = new Schema({
  vendorBill:   { type: ObjectId, ref: 'VendorBill', required: true },
  billNumber:   { type: String },
  allocatedAmount: { type: Number, required: true, min: 0 },
}, { _id: true });

const vendorPaymentSchema = new Schema({
  paymentNumber:   { type: String, unique: true },
  paymentType:     { type: String, enum: ['manual','batch','scheduled','advance','partial','reversal'], default: 'manual' },
  vendor:          { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:      { type: String, trim: true },
  paymentDate:     { type: Date, required: true, default: Date.now },
  paymentMethod:   { type: String, enum: ['bank_transfer','cheque','cash','upi','neft','rtgs','imps','dd'], default: 'bank_transfer' },
  bankAccount:     { type: String, trim: true },
  chequeNumber:    { type: String, trim: true },
  chequeDate:      { type: Date },
  utrNumber:       { type: String, trim: true },
  amount:          { type: Number, required: true, min: 0 },
  currency:        { type: String, default: 'INR' },
  exchangeRate:    { type: Number, default: 1 },
  tdsAmount:       { type: Number, default: 0 },     // Tax Deducted at Source
  withholdingTax:  { type: Number, default: 0 },
  netAmount:       { type: Number, default: 0 },
  allocations:     [paymentAllocationSchema],
  unallocatedAmount: { type: Number, default: 0 },
  isAdvance:       { type: Boolean, default: false },
  advanceAdjusted: { type: Boolean, default: false },
  status:          { type: String, enum: ['draft','approved','posted','reversed','cancelled'], default: 'draft' },
  reversedFrom:    { type: ObjectId, ref: 'VendorPayment' },
  reversalReason:  { type: String },
  journalEntry:    { type: ObjectId, ref: 'JournalEntry' },
  glPosted:        { type: Boolean, default: false },
  paymentBatch:    { type: ObjectId, ref: 'PaymentBatch' },
  paymentRun:      { type: ObjectId, ref: 'PaymentRun' },
  approvedBy:      { type: ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  notes:           { type: String },
  attachments:     [{ fileName: String, fileUrl: String }],
  createdBy:       { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

vendorPaymentSchema.index({ vendor: 1, isDeleted: 1 });
vendorPaymentSchema.index({ status: 1, isDeleted: 1 });
vendorPaymentSchema.index({ paymentDate: -1 });
vendorPaymentSchema.index({ paymentBatch: 1 });

vendorPaymentSchema.pre('save', async function (next) {
  if (!this.paymentNumber) {
    const prefix = `VP-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ paymentNumber: { $regex: `^${prefix}` } });
    this.paymentNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.netAmount) {
    this.netAmount = (this.amount || 0) - (this.tdsAmount || 0) - (this.withholdingTax || 0);
  }
  next();
});

module.exports = mongoose.model('VendorPayment', vendorPaymentSchema);
