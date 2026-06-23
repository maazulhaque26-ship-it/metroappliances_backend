const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Payment Allocation — standalone record linking a payment to one or more bills
const paymentAllocationSchema = new Schema({
  allocationNumber:  { type: String, unique: true },
  vendorPayment:     { type: ObjectId, ref: 'VendorPayment', required: true },
  paymentNumber:     { type: String, trim: true },
  vendor:            { type: ObjectId, ref: 'Vendor', required: true },
  allocationDate:    { type: Date, required: true, default: Date.now },
  lines: [{
    vendorBill:      { type: ObjectId, ref: 'VendorBill', required: true },
    billNumber:      { type: String },
    billTotal:       { type: Number, default: 0 },
    outstandingBefore: { type: Number, default: 0 },
    allocatedAmount: { type: Number, required: true, min: 0 },
    outstandingAfter:  { type: Number, default: 0 },
    discountTaken:   { type: Number, default: 0 },
  }],
  totalAllocated:    { type: Number, default: 0 },
  totalDiscount:     { type: Number, default: 0 },
  status:            { type: String, enum: ['draft','posted','reversed'], default: 'draft' },
  journalEntry:      { type: ObjectId, ref: 'JournalEntry' },
  createdBy:         { type: ObjectId, ref: 'User' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

paymentAllocationSchema.index({ vendorPayment: 1 });
paymentAllocationSchema.index({ vendor: 1, allocationDate: -1 });
paymentAllocationSchema.index({ 'lines.vendorBill': 1 });

paymentAllocationSchema.pre('validate', async function (next) {
  if (!this.allocationNumber) {
    const year = new Date().getFullYear();
    const prefix = `ALLOC-${year}-`;
    const count = await this.constructor.countDocuments({ allocationNumber: { $regex: `^ALLOC-${year}-` } });
    this.allocationNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentAllocation', paymentAllocationSchema);
