const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const paymentRunSchema = new Schema({
  runNumber:      { type: String, unique: true },
  runDate:        { type: Date, required: true, default: Date.now },
  paymentDate:    { type: Date },
  paymentMethod:  { type: String, enum: ['bank_transfer','cheque','neft','rtgs','upi'], default: 'bank_transfer' },
  bankAccount:    { type: String, trim: true },
  filterVendors:  [{ type: ObjectId, ref: 'Vendor' }],
  filterDueBefore:{ type: Date },
  filterOverdue:  { type: Boolean, default: false },
  proposalList: [{
    vendor:          { type: ObjectId, ref: 'Vendor' },
    vendorName:      String,
    bills:           [{ type: ObjectId, ref: 'VendorBill' }],
    billCount:       Number,
    totalDue:        Number,
    paymentAmount:   Number,
    include:         { type: Boolean, default: true },
  }],
  totalProposed:  { type: Number, default: 0 },
  totalApproved:  { type: Number, default: 0 },
  vendorCount:    { type: Number, default: 0 },
  billCount:      { type: Number, default: 0 },
  status:         { type: String, enum: ['draft','proposed','approved','executed','partially_failed','failed','cancelled'], default: 'draft' },
  executedAt:     { type: Date },
  approvedBy:     { type: ObjectId, ref: 'User' },
  approvedAt:     { type: Date },
  paymentBatch:   { type: ObjectId, ref: 'PaymentBatch' },
  notes:          { type: String },
  createdBy:      { type: ObjectId, ref: 'User' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

paymentRunSchema.index({ status: 1, isDeleted: 1 });
paymentRunSchema.index({ runDate: -1 });

paymentRunSchema.pre('save', async function (next) {
  if (!this.runNumber) {
    const prefix = `PR-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ runNumber: { $regex: `^${prefix}` } });
    this.runNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentRun', paymentRunSchema);
