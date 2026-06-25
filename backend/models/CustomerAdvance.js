const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const customerAdvanceSchema = new Schema({
  advanceNumber:    { type: String, unique: true },
  customer:         { type: ObjectId, ref: 'User', required: true },
  customerName:     { type: String, trim: true },
  advanceDate:      { type: Date, required: true, default: Date.now },
  advanceAmount:    { type: Number, required: true, min: 0 },
  availableAmount:  { type: Number, default: 0 },
  adjustedAmount:   { type: Number, default: 0 },
  receiptNumber:    { type: String, trim: true },
  customerReceipt:  { type: ObjectId, ref: 'CustomerReceipt' },
  paymentMode:      { type: String, enum: ['cash','cheque','bank_transfer','upi','card','online_gateway'], default: 'bank_transfer' },
  referenceNo:      { type: String, trim: true },
  narration:        { type: String, trim: true },
  status:           { type: String, enum: ['received','partially_applied','fully_applied','refunded','cancelled'], default: 'received' },
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  bankAccount:      { type: ObjectId, ref: 'ChartOfAccount' },
  arAccount:        { type: ObjectId, ref: 'ChartOfAccount' },
  createdBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

customerAdvanceSchema.index({ customer: 1, isDeleted: 1 });
customerAdvanceSchema.index({ status: 1, isDeleted: 1 });
customerAdvanceSchema.index({ advanceDate: -1 });

customerAdvanceSchema.pre('save', async function (next) {
  if (!this.advanceNumber) {
    const prefix = `CADV-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ advanceNumber: { $regex: `^${prefix}` } });
    this.advanceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  if (this.isNew) {
    this.availableAmount = this.advanceAmount;
  }
  next();
});

module.exports = mongoose.model('CustomerAdvance', customerAdvanceSchema);
