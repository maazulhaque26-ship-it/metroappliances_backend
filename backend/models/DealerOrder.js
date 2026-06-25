const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name:         { type: String, required: true },
  image:        { type: String, default: '' },
  sku:          { type: String, default: '' },
  quantity:     { type: Number, required: true, min: 1 },
  dealerPrice:  { type: Number, required: true, min: 0 },
  mrp:          { type: Number, required: true, min: 0 },
  moq:          { type: Number, default: 1 },
  caseQuantity: { type: Number, default: 1 },
  lineTotal:    { type: Number, required: true, min: 0 },
}, { _id: true });

const dealerOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    // format: MTR-DO-YYYYMM-XXXXX — generated in pre-save
  },

  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },

  items: { type: [orderItemSchema], default: [] },

  // ── Financials ─────────────────────────────────────────────────────────────
  subtotal:      { type: Number, required: true, min: 0 },
  taxAmount:     { type: Number, default: 0, min: 0 },
  shippingCost:  { type: Number, default: 0, min: 0 },
  totalAmount:   { type: Number, required: true, min: 0 },

  // ── Shipping address (snapshot at order time) ──────────────────────────────
  shippingAddress: {
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    city:         { type: String, default: '' },
    district:     { type: String, default: '' },
    state:        { type: String, default: '' },
    pincode:      { type: String, default: '' },
  },

  // ── Order lifecycle ────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },

  // Dealer orders above a threshold may require admin approval
  requiresApproval: { type: Boolean, default: false },
  isApproved:       { type: Boolean, default: false },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: { type: Date, default: null },

  // ── Tracking ──────────────────────────────────────────────────────────────
  trackingNumber: { type: String, default: '' },
  trackingUrl:    { type: String, default: '' },
  shippedAt:      { type: Date, default: null },
  deliveredAt:    { type: Date, default: null },
  cancelledAt:    { type: Date, default: null },
  cancelReason:   { type: String, default: '' },

  // ── Notes ─────────────────────────────────────────────────────────────────
  dealerNote: { type: String, default: '' },
  adminNotes:  { type: String, default: '' },
}, { timestamps: true });

// ── Auto-generate order number ─────────────────────────────────────────────
dealerOrderSchema.pre('save', async function (next) {
  if (this.orderNumber) return next();
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = await mongoose.model('DealerOrder').countDocuments() + 1;
  this.orderNumber = `MTR-DO-${ym}-${String(seq).padStart(5, '0')}`;
  next();
});

dealerOrderSchema.index({ dealer: 1, createdAt: -1 });
dealerOrderSchema.index({ status: 1 });
dealerOrderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('DealerOrder', dealerOrderSchema);
