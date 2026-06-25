const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const paymentBatchSchema = new Schema({
  batchNumber:   { type: String, unique: true },
  batchDate:     { type: Date, required: true, default: Date.now },
  paymentMethod: { type: String, enum: ['bank_transfer','cheque','neft','rtgs','upi'], default: 'bank_transfer' },
  bankAccount:   { type: String, trim: true },
  totalAmount:   { type: Number, default: 0 },
  vendorCount:   { type: Number, default: 0 },
  billCount:     { type: Number, default: 0 },
  payments:      [{ type: ObjectId, ref: 'VendorPayment' }],
  status:        { type: String, enum: ['draft','approved','processing','completed','failed','cancelled'], default: 'draft' },
  processedAt:   { type: Date },
  approvedBy:    { type: ObjectId, ref: 'User' },
  approvedAt:    { type: Date },
  notes:         { type: String },
  createdBy:     { type: ObjectId, ref: 'User' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

paymentBatchSchema.index({ status: 1, isDeleted: 1 });
paymentBatchSchema.index({ batchDate: -1 });

paymentBatchSchema.pre('save', async function (next) {
  if (!this.batchNumber) {
    const prefix = `PB-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ batchNumber: { $regex: `^${prefix}` } });
    this.batchNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentBatch', paymentBatchSchema);
