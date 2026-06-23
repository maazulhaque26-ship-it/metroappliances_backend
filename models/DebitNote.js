const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Debit Note — raised when vendor over-billed or goods returned
const debitNoteSchema = new Schema({
  debitNoteNumber: { type: String, unique: true },
  vendor:          { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:      { type: String, trim: true },
  vendorBill:      { type: ObjectId, ref: 'VendorBill' },
  debitNoteDate:   { type: Date, required: true, default: Date.now },
  reason:          { type: String, enum: ['price_difference','quantity_difference','goods_returned','quality_issue','other'], default: 'price_difference' },
  description:     { type: String, trim: true },
  items: [{
    description:  { type: String },
    quantity:     { type: Number, default: 0 },
    unitPrice:    { type: Number, default: 0 },
    taxRate:      { type: Number, default: 0 },
    taxAmount:    { type: Number, default: 0 },
    lineTotal:    { type: Number, default: 0 },
  }],
  subtotal:        { type: Number, default: 0 },
  gstTotal:        { type: Number, default: 0 },
  totalAmount:     { type: Number, default: 0 },
  adjustedAmount:  { type: Number, default: 0 },
  status:          { type: String, enum: ['draft','submitted','approved','adjusted','cancelled'], default: 'draft' },
  journalEntry:    { type: ObjectId, ref: 'JournalEntry' },
  glPosted:        { type: Boolean, default: false },
  approvedBy:      { type: ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  createdBy:       { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

debitNoteSchema.index({ vendor: 1, isDeleted: 1 });
debitNoteSchema.index({ status: 1 });

debitNoteSchema.pre('save', async function (next) {
  if (!this.debitNoteNumber) {
    const prefix = `DN-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ debitNoteNumber: { $regex: `^${prefix}` } });
    this.debitNoteNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('DebitNote', debitNoteSchema);
