const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const receiptAllocationLineSchema = new Schema({
  customerInvoice:  { type: ObjectId, ref: 'CustomerInvoice', required: true },
  invoiceNumber:    { type: String },
  allocatedAmount:  { type: Number, required: true, min: 0 },
  discount:         { type: Number, default: 0 },
  writeOff:         { type: Number, default: 0 },
  netAllocated:     { type: Number, default: 0 },
}, { _id: true });

const customerReceiptSchema = new Schema({
  receiptNumber:    { type: String, unique: true },
  receiptType:      { type: String, enum: ['cash','cheque','bank_transfer','upi','card','online_gateway','advance','partial'], default: 'bank_transfer' },
  customer:         { type: ObjectId, ref: 'User', required: true },
  customerName:     { type: String, trim: true },
  receiptDate:      { type: Date, required: true, default: Date.now },
  amount:           { type: Number, required: true, min: 0 },
  bankCharges:      { type: Number, default: 0 },
  netAmount:        { type: Number, default: 0 },
  currency:         { type: String, default: 'INR' },
  exchangeRate:     { type: Number, default: 1 },
  bankAccount:      { type: ObjectId, ref: 'ChartOfAccount' },
  arAccount:        { type: ObjectId, ref: 'ChartOfAccount' },
  paymentMode:      { type: String, trim: true },
  referenceNo:      { type: String, trim: true },
  chequeNo:         { type: String, trim: true },
  chequeDate:       { type: Date },
  bankName:         { type: String, trim: true },
  transactionId:    { type: String, trim: true },
  utrNumber:        { type: String, trim: true },
  status:           { type: String, enum: ['draft','posted','reversed','bounced','cancelled'], default: 'draft' },
  isAdvance:        { type: Boolean, default: false },
  unallocatedAmount:{ type: Number, default: 0 },
  allocations:      [receiptAllocationLineSchema],
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  reversedFrom:     { type: ObjectId, ref: 'CustomerReceipt' },
  reversalReason:   { type: String },
  receiptBatch:     { type: ObjectId, ref: 'ReceiptBatch' },
  notes:            { type: String },
  attachments:      [{ fileName: String, fileUrl: String }],
  createdBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

customerReceiptSchema.index({ customer: 1, isDeleted: 1 });
customerReceiptSchema.index({ status: 1, isDeleted: 1 });
customerReceiptSchema.index({ receiptDate: -1 });
customerReceiptSchema.index({ receiptBatch: 1 });

customerReceiptSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    const prefix = `CR-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ receiptNumber: { $regex: `^${prefix}` } });
    this.receiptNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.netAmount) {
    this.netAmount = (this.amount || 0) - (this.bankCharges || 0);
  }
  next();
});

module.exports = mongoose.model('CustomerReceipt', customerReceiptSchema);
