const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  name:     { type: String, required: true },
  sku:      { type: String, default: '' },
  hsn:      { type: String, default: '' },     // HSN / SAC code
  quantity: { type: Number, required: true, min: 1 },
  rate:     { type: Number, required: true, min: 0 }, // dealer price per unit
  mrp:      { type: Number, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },

  // GST breakdown per line
  cgstRate:   { type: Number, default: 0 },
  sgstRate:   { type: Number, default: 0 },
  igstRate:   { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
}, { _id: true });

const dealerInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true }, // MTR-INV-YYYYMM-XXXXX

  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerOrder',
    default: null,
  },

  items: { type: [invoiceItemSchema], default: [] },

  // ── Tax totals ─────────────────────────────────────────────────────────────
  subtotal:   { type: Number, required: true, min: 0 },
  cgstTotal:  { type: Number, default: 0 },
  sgstTotal:  { type: Number, default: 0 },
  igstTotal:  { type: Number, default: 0 },
  totalTax:   { type: Number, default: 0 },
  roundOff:   { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, min: 0 },

  // ── GST info ───────────────────────────────────────────────────────────────
  gstType:    { type: String, enum: ['B2B', 'B2C'], default: 'B2B' },
  supplyType: { type: String, enum: ['intrastate', 'interstate'], default: 'intrastate' },

  // ── Transport ──────────────────────────────────────────────────────────────
  transportDetails: {
    lrNumber:        { type: String, default: '' },
    transporterName: { type: String, default: '' },
    vehicleNumber:   { type: String, default: '' },
    transportCharge: { type: Number, default: 0 },
  },

  // ── Address snapshots ──────────────────────────────────────────────────────
  billingAddress: {
    businessName: { type: String, default: '' },
    gstNumber:    { type: String, default: '' },
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    city:         { type: String, default: '' },
    state:        { type: String, default: '' },
    pincode:      { type: String, default: '' },
  },
  shippingAddress: {
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    city:         { type: String, default: '' },
    state:        { type: String, default: '' },
    pincode:      { type: String, default: '' },
  },

  // ── Status & lifecycle ─────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  dueDate:      { type: Date, default: null },
  paidAt:       { type: Date, default: null },
  cancelledAt:  { type: Date, default: null },
  cancelReason: { type: String, default: '' },

  // ── Notes & metadata ──────────────────────────────────────────────────────
  notes:      { type: String, default: '' },
  pdfUrl:     { type: String, default: '' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

dealerInvoiceSchema.pre('save', async function (next) {
  if (this.invoiceNumber) return next();
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = await mongoose.model('DealerInvoice').countDocuments() + 1;
  this.invoiceNumber = `MTR-INV-${ym}-${String(seq).padStart(5, '0')}`;
  next();
});

dealerInvoiceSchema.index({ dealer: 1, createdAt: -1 });
dealerInvoiceSchema.index({ status: 1 });
dealerInvoiceSchema.index({ order: 1 });

module.exports = mongoose.model('DealerInvoice', dealerInvoiceSchema);
