const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  sku:           { type: String, default: '' },
  price:         { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0 },
  stock:         { type: Number, required: true, default: 0, min: 0 },
  images:        [{ url: String, public_id: String }],
  specs:         [{ key: String, value: String }],
  isDefault:     { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  sku: { type: String, default: '' },
  description: { type: String, required: true },
  brand: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ url: String, public_id: String }],
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  specs: [{ key: String, value: String }],
  tags: [String],
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  hasVariants: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isDealOfDay: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  variants: [variantSchema],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);