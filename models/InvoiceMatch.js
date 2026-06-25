const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Invoice Matching — 3-way match: PO ↔ GRN ↔ Vendor Bill
const invoiceMatchSchema = new Schema({
  matchNumber:     { type: String, unique: true },
  vendorBill:      { type: ObjectId, ref: 'VendorBill', required: true },
  purchaseOrder:   { type: ObjectId, ref: 'PurchaseOrder' },
  grn:             { type: ObjectId, ref: 'GRN' },
  vendor:          { type: ObjectId, ref: 'Vendor', required: true },
  matchDate:       { type: Date, default: Date.now },
  matchStatus:     { type: String, enum: ['matched','partial_match','mismatch','exception','manual_override'], default: 'matched' },
  tolerancePct:    { type: Number, default: 2 },   // Acceptable % variance
  discrepancies: [{
    field:        { type: String },   // 'quantity','price','total'
    poValue:      { type: Number },
    grnValue:     { type: Number },
    billValue:    { type: Number },
    variance:     { type: Number },
    variancePct:  { type: Number },
    isWithinTolerance: { type: Boolean, default: false },
  }],
  itemMatches: [{
    productName:   String,
    poQty:         Number,
    grnQty:        Number,
    billQty:       Number,
    poPrice:       Number,
    grnPrice:      Number,
    billPrice:     Number,
    qtyMatch:      Boolean,
    priceMatch:    Boolean,
    status:        { type: String, enum: ['matched','quantity_mismatch','price_mismatch','missing_grn','missing_po','exception'] },
  }],
  overallMatch:    { type: Boolean, default: false },
  resolvedBy:      { type: ObjectId, ref: 'User' },
  resolvedAt:      { type: Date },
  resolutionNotes: { type: String },
  autoApproved:    { type: Boolean, default: false },
  createdBy:       { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

invoiceMatchSchema.index({ vendorBill: 1 });
invoiceMatchSchema.index({ matchStatus: 1, isDeleted: 1 });
invoiceMatchSchema.index({ vendor: 1 });

invoiceMatchSchema.pre('save', async function (next) {
  if (!this.matchNumber) {
    const prefix = `IM-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ matchNumber: { $regex: `^${prefix}` } });
    this.matchNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('InvoiceMatch', invoiceMatchSchema);
