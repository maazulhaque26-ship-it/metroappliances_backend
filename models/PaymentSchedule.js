const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Payment Schedule — scheduled future AP payments tied to vendor bills
const paymentScheduleSchema = new Schema({
  scheduleNumber:  { type: String, unique: true },
  vendor:          { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:      { type: String, trim: true },
  vendorBill:      { type: ObjectId, ref: 'VendorBill', required: true },
  billNumber:      { type: String, trim: true },
  scheduledDate:   { type: Date, required: true },
  dueDate:         { type: Date },
  scheduledAmount: { type: Number, required: true, min: 0 },
  paidAmount:      { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentMethod:   { type: String, enum: ['bank_transfer','cheque','cash','upi','neft','rtgs','imps','dd'], default: 'bank_transfer' },
  bankAccount:     { type: String, trim: true },
  installmentNumber: { type: Number, default: 1 },
  totalInstallments: { type: Number, default: 1 },
  paymentTerm:     { type: ObjectId, ref: 'PaymentTerm' },
  priority:        { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  status:          { type: String, enum: ['scheduled','approved','processing','paid','overdue','cancelled'], default: 'scheduled' },
  vendorPayment:   { type: ObjectId, ref: 'VendorPayment' },
  approvedBy:      { type: ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  notes:           { type: String },
  createdBy:       { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

paymentScheduleSchema.index({ vendor: 1, scheduledDate: 1 });
paymentScheduleSchema.index({ status: 1, scheduledDate: 1 });
paymentScheduleSchema.index({ vendorBill: 1 });

paymentScheduleSchema.pre('validate', async function (next) {
  if (!this.scheduleNumber) {
    const year = new Date().getFullYear();
    const prefix = `PS-${year}-`;
    const count = await this.constructor.countDocuments({ scheduleNumber: { $regex: `^PS-${year}-` } });
    this.scheduleNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.remainingAmount) {
    this.remainingAmount = (this.scheduledAmount || 0) - (this.paidAmount || 0);
  }
  next();
});

module.exports = mongoose.model('PaymentSchedule', paymentScheduleSchema);
