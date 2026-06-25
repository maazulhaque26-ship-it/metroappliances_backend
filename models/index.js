const mongoose = require('mongoose');

// ── Coupon ────────────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:            { type: String, enum: ['percentage', 'flat', 'free_shipping', 'first_order'], required: true },
  value:           { type: Number, required: true },
  minOrderAmount:  { type: Number, default: 0 },
  maxDiscount:     { type: Number, default: 0 },
  startDate:       { type: Date,   default: null },
  expiryDate:      { type: Date,   required: true },
  usageLimit:      { type: Number, default: 100 },
  usageCount:      { type: Number, default: 0 },
  perUserLimit:    { type: Number, default: 0 },
  isActive:        { type: Boolean, default: true },
  description:     { type: String, default: '', trim: true },
  // Scope restrictions — if empty, applies to all
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && this.startDate > now) return false;
  if (this.expiryDate < now) return false;
  if (this.usageLimit > 0 && this.usageCount >= this.usageLimit) return false;
  return true;
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (orderAmount < this.minOrderAmount) return 0;
  if (this.type === 'free_shipping') return 0; // shipping handled separately
  if (this.type === 'percentage' || this.type === 'first_order') {
    const disc = (orderAmount * this.value) / 100;
    return this.maxDiscount > 0 ? Math.min(disc, this.maxDiscount) : disc;
  }
  return Math.min(this.value, orderAmount);
};

// ── Cart ──────────────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:     { type: Number, required: true, min: 1, default: 1 },
  price:        { type: Number, required: true },
  variantId:    { type: String, default: '' },
  variantName:  { type: String, default: '' },
  variantSku:   { type: String, default: '' },
  variantImage: { type: String, default: '' },
});

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

// ── Wishlist ──────────────────────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

// ── Exports ───────────────────────────────────────────────────────────────────
const Coupon   = mongoose.model('Coupon',   couponSchema);
const Cart     = mongoose.model('Cart',     cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = { Coupon, Cart, Wishlist };