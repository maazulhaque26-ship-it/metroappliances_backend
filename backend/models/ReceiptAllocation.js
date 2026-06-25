const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const allocationLineSchema = new Schema({
  customerInvoice: { type: ObjectId, ref: 'CustomerInvoice', required: true },
  invoiceNumber:   { type: String },
  invoiceDate:     { type: Date },
  invoiceAmount:   { type: Number, default: 0 },
  outstanding:     { type: Number, default: 0 },
  allocatedAmount: { type: Number, required: true, min: 0 },
  discount:        { type: Number, default: 0 },
  writeOff:        { type: Number, default: 0 },
  netAllocated:    { type: Number, default: 0 },
}, { _id: true });

const receiptAllocationSchema = new Schema({
  allocationNumber:  { type: String, unique: true },
  customerReceipt:   { type: ObjectId, ref: 'CustomerReceipt', required: true },
  customer:          { type: ObjectId, ref: 'User', required: true },
  customerName:      { type: String, trim: true },
  allocationDate:    { type: Date, required: true, default: Date.now },
  lines:             [allocationLineSchema],
  totalAllocated:    { type: Number, default: 0 },
  totalDiscount:     { type: Number, default: 0 },
  totalWriteOff:     { type: Number, default: 0 },
  status:            { type: String, enum: ['draft','posted','reversed'], default: 'draft' },
  journalEntry:      { type: ObjectId, ref: 'JournalEntry' },
  notes:             { type: String },
  createdBy:         { type: ObjectId, ref: 'User' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

receiptAllocationSchema.index({ customerReceipt: 1 });
receiptAllocationSchema.index({ customer: 1, isDeleted: 1 });

receiptAllocationSchema.pre('validate', async function (next) {
  if (!this.allocationNumber) {
    const yr = new Date().getFullYear();
    const prefix = `RALLOC-${yr}-`;
    const count = await this.constructor.countDocuments({ allocationNumber: { $regex: `^${prefix}` } });
    this.allocationNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ReceiptAllocation', receiptAllocationSchema);
