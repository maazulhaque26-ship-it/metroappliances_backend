const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const invoiceItemSchema = new Schema({
  product:     { type: ObjectId, ref: 'Product' },
  description: { type: String, trim: true },
  quantity:    { type: Number, default: 1, min: 0 },
  unit:        { type: String, default: 'pcs' },
  unitPrice:   { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },
  taxRate:     { type: Number, default: 0 },
  taxAmount:   { type: Number, default: 0 },
  igst:        { type: Number, default: 0 },
  cgst:        { type: Number, default: 0 },
  sgst:        { type: Number, default: 0 },
  lineTotal:   { type: Number, default: 0 },
  hsn:         { type: String, trim: true },
  costCenter:  { type: ObjectId, ref: 'CostCenter' },
  glAccount:   { type: ObjectId, ref: 'ChartOfAccount' },
}, { _id: true });

const customerInvoiceSchema = new Schema({
  invoiceNumber:     { type: String, unique: true },
  invoiceType:       { type: String, enum: ['sales','service','installation','debit_note','proforma'], default: 'sales' },
  customer:          { type: ObjectId, ref: 'User', required: true },
  customerName:      { type: String, trim: true },
  customerGST:       { type: String, trim: true },
  customerEmail:     { type: String, trim: true },
  customerPhone:     { type: String, trim: true },
  billingAddress:    { type: String, trim: true },
  order:             { type: ObjectId, ref: 'Order' },
  dealerOrder:       { type: ObjectId, ref: 'DealerOrder' },
  serviceRequest:    { type: ObjectId, ref: 'ServiceRequest' },
  installationRequest: { type: ObjectId, ref: 'InstallationRequest' },
  invoiceDate:       { type: Date, required: true, default: Date.now },
  dueDate:           { type: Date },
  paymentTerm:       { type: String, enum: ['immediate','net7','net15','net30','net45','net60','net90','custom'], default: 'net30' },
  items:             [invoiceItemSchema],
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
  status:            { type: String, enum: ['draft','submitted','approved','partially_paid','paid','overdue','cancelled','written_off'], default: 'draft' },
  approvalStatus:    { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy:        { type: ObjectId, ref: 'User' },
  approvedAt:        { type: Date },
  rejectedReason:    { type: String },
  journalEntry:      { type: ObjectId, ref: 'JournalEntry' },
  glPosted:          { type: Boolean, default: false },
  arAccount:         { type: ObjectId, ref: 'ChartOfAccount' },
  revenueAccount:    { type: ObjectId, ref: 'ChartOfAccount' },
  salesRegisterEntry: { type: ObjectId, ref: 'SalesRegister' },
  notes:             { type: String },
  attachments:       [{ fileName: String, fileUrl: String, uploadedAt: { type: Date, default: Date.now } }],
  createdBy:         { type: ObjectId, ref: 'User' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

customerInvoiceSchema.index({ customer: 1, isDeleted: 1 });
customerInvoiceSchema.index({ status: 1, isDeleted: 1 });
customerInvoiceSchema.index({ dueDate: 1, status: 1 });
customerInvoiceSchema.index({ order: 1 });
customerInvoiceSchema.index({ invoiceDate: -1 });

customerInvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const prefix = `CI-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ invoiceNumber: { $regex: `^${prefix}` } });
    this.invoiceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CustomerInvoice', customerInvoiceSchema);
