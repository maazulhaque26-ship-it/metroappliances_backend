const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Credit Note — received from vendor as allowance/refund
const creditNoteSchema = new Schema({
  creditNoteNumber:  { type: String, unique: true },
  vendor:            { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:        { type: String, trim: true },
  vendorBill:        { type: ObjectId, ref: 'VendorBill' },
  creditNoteDate:    { type: Date, required: true, default: Date.now },
  vendorCNNumber:    { type: String, trim: true },   // Vendor's own CN ref
  reason:            { type: String, enum: ['price_difference','quantity_difference','discount','quality_allowance','other'], default: 'price_difference' },
  description:       { type: String, trim: true },
  items: [{
    description:   { type: String },
    quantity:      { type: Number, default: 0 },
    unitPrice:     { type: Number, default: 0 },
    taxRate:       { type: Number, default: 0 },
    taxAmount:     { type: Number, default: 0 },
    lineTotal:     { type: Number, default: 0 },
  }],
  subtotal:          { type: Number, default: 0 },
  gstTotal:          { type: Number, default: 0 },
  totalAmount:       { type: Number, default: 0 },
  adjustedAmount:    { type: Number, default: 0 },
  status:            { type: String, enum: ['draft','submitted','approved','adjusted','cancelled'], default: 'draft' },
  journalEntry:      { type: ObjectId, ref: 'JournalEntry' },
  glPosted:          { type: Boolean, default: false },
  approvedBy:        { type: ObjectId, ref: 'User' },
  approvedAt:        { type: Date },
  createdBy:         { type: ObjectId, ref: 'User' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

creditNoteSchema.index({ vendor: 1, isDeleted: 1 });
creditNoteSchema.index({ status: 1 });

creditNoteSchema.pre('save', async function (next) {
  if (!this.creditNoteNumber) {
    const prefix = `CN-AP-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ creditNoteNumber: { $regex: `^CN-AP-` } });
    this.creditNoteNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('APCreditNote', creditNoteSchema);
