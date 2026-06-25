const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const vendorAdvanceSchema = new Schema({
  advanceNumber:    { type: String, unique: true },
  vendor:           { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:       { type: String, trim: true },
  requestDate:      { type: Date, required: true, default: Date.now },
  advanceDate:      { type: Date },
  requestedAmount:  { type: Number, required: true, min: 0 },
  approvedAmount:   { type: Number, default: 0 },
  paidAmount:       { type: Number, default: 0 },
  adjustedAmount:   { type: Number, default: 0 },
  balanceAmount:    { type: Number, default: 0 },
  purpose:          { type: String, trim: true },
  purchaseOrder:    { type: ObjectId, ref: 'PurchaseOrder' },
  paymentMethod:    { type: String, enum: ['bank_transfer','cheque','cash','upi','neft','rtgs','imps'], default: 'bank_transfer' },
  status:           { type: String, enum: ['draft','submitted','approved','paid','adjusted','cancelled','rejected'], default: 'draft' },
  approvedBy:       { type: ObjectId, ref: 'User' },
  approvedAt:       { type: Date },
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  notes:            { type: String },
  createdBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

vendorAdvanceSchema.index({ vendor: 1, isDeleted: 1 });
vendorAdvanceSchema.index({ status: 1 });

vendorAdvanceSchema.pre('save', async function (next) {
  if (!this.advanceNumber) {
    const prefix = `VA-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ advanceNumber: { $regex: `^${prefix}` } });
    this.advanceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('VendorAdvance', vendorAdvanceSchema);
