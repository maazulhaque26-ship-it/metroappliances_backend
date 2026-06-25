const mongoose = require('mongoose');

const bulkDiscountSchema = new mongoose.Schema({
  minQty:          { type: Number, required: true, min: 1 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountedPrice: { type: Number, required: true, min: 0 },
}, { _id: true });

const dealerPricingSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    unique: true,
  },

  // ── Pricing tiers ─────────────────────────────────────────────────────────
  mrp:              { type: Number, required: [true, 'MRP is required'], min: 0 },
  dealerPrice:      { type: Number, required: [true, 'Dealer price is required'], min: 0 },
  distributorPrice: { type: Number, default: null, min: 0 },

  // ── Order constraints ─────────────────────────────────────────────────────
  moq:          { type: Number, default: 1, min: 1 },   // minimum order quantity
  caseQuantity: { type: Number, default: 1, min: 1 },   // units per case/pack

  // ── Bulk discount tiers ───────────────────────────────────────────────────
  bulkDiscounts: { type: [bulkDiscountSchema], default: [] },

  // ── Visibility & status ───────────────────────────────────────────────────
  dealerVisible: { type: Boolean, default: true },
  isActive:      { type: Boolean, default: true },

  notes: { type: String, default: '' },
}, { timestamps: true });

dealerPricingSchema.index({ dealerVisible: 1, isActive: 1 });
dealerPricingSchema.index({ product: 1 });

// Validate dealer price does not exceed MRP
dealerPricingSchema.pre('save', function (next) {
  if (this.dealerPrice > this.mrp) {
    return next(new Error('Dealer price cannot exceed MRP'));
  }
  if (this.distributorPrice !== null && this.distributorPrice > this.dealerPrice) {
    return next(new Error('Distributor price cannot exceed dealer price'));
  }
  next();
});

module.exports = mongoose.model('DealerPricing', dealerPricingSchema);
