const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const billItemSchema = new Schema({
  product:      { type: ObjectId, ref: 'Product' },
  description:  { type: String, trim: true },
  quantity:     { type: Number, default: 1, min: 0 },
  unit:         { type: String, default: 'pcs' },
  unitPrice:    { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },
  taxRate:      { type: Number, default: 0 },        // GST %
  taxAmount:    { type: Number, default: 0 },
  igst:         { type: Number, default: 0 },
  cgst:         { type: Number, default: 0 },
  sgst:         { type: Number, default: 0 },
  lineTotal:    { type: Number, default: 0 },
  costCenter:   { type: ObjectId, ref: 'CostCenter' },
  glAccount:    { type: ObjectId, ref: 'ChartOfAccount' },
}, { _id: true });

const vendorBillSchema = new Schema({
  billNumber:        { type: String, unique: true },
  billType:          { type: String, enum: ['bill','debit_note','advance_request'], default: 'bill' },
  vendor:            { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:        { type: String, trim: true },
  vendorGST:         { type: String, trim: true },
  purchaseOrder:     { type: ObjectId, ref: 'PurchaseOrder' },
  grn:               { type: ObjectId, ref: 'GRN' },
  vendorInvoiceNo:   { type: String, trim: true },
  vendorInvoiceDate: { type: Date },
  billDate:          { type: Date, required: true, default: Date.now },
  dueDate:           { type: Date },
  paymentTerm:       { type: String, enum: ['advance','net7','net15','net30','net45','net60','net90','custom'], default: 'net30' },
  items:             [billItemSchema],
  subtotal:          { type: Number, default: 0 },
  discountTotal:     { type: Number, default: 0 },
  taxableAmount:     { type: Number, default: 0 },
  igstTotal:         { type: Number, default: 0 },
  cgstTotal:         { type: Number, default: 0 },
  sgstTotal:         { type: Number, default: 0 },
  gstTotal:          { type: Number, default: 0 },
  totalAmount:       { type: Number, default: 0 },
  paidAmount:        { type: Number, default: 0 },
  outstandingAmount: { type: Number, default: 0 },
  currency:          { type: String, default: 'INR' },
  exchangeRate:      { type: Number, default: 1 },
  isReverseCharge:   { type: Boolean, default: false },
  gstInputCredit:    { type: Boolean, default: true },
  status:            { type: String, enum: ['draft','submitted','approved','partially_paid','paid','overdue','cancelled','rejected'], default: 'draft' },
  approvalStatus:    { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy:        { type: ObjectId, ref: 'User' },
  approvedAt:        { type: Date },
  rejectedReason:    { type: String },
  journalEntry:      { type: ObjectId, ref: 'JournalEntry' },
  glPosted:          { type: Boolean, default: false },
  apAccount:         { type: ObjectId, ref: 'ChartOfAccount' },
  notes:             { type: String },
  attachments:       [{ fileName: String, fileUrl: String, uploadedAt: { type: Date, default: Date.now } }],
  createdBy:         { type: ObjectId, ref: 'User' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

vendorBillSchema.index({ vendor: 1, isDeleted: 1 });
vendorBillSchema.index({ status: 1, isDeleted: 1 });
vendorBillSchema.index({ dueDate: 1, status: 1 });
vendorBillSchema.index({ purchaseOrder: 1 });
vendorBillSchema.index({ grn: 1 });
vendorBillSchema.index({ billDate: -1 });

vendorBillSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const prefix = `VB-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ billNumber: { $regex: `^${prefix}` } });
    this.billNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('VendorBill', vendorBillSchema);
