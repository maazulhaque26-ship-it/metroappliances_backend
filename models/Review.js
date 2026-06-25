const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  title:   { type: String, default: '' },
  comment: { type: String, required: true },
  images:  [{ url: String, public_id: String }],
  avatar:  { type: String, default: '' },
  city:    { type: String, default: '' },
  status:  { type: String, enum: ['pending', 'approved', 'rejected', 'hidden'], default: 'pending' },
}, { timestamps: true });

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

async function updateProductRating(productId) {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const Product = mongoose.model('Product');
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings:    Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratings: 0, numReviews: 0 });
  }
}

reviewSchema.post('save', function () { updateProductRating(this.product); });
reviewSchema.post('findOneAndDelete', function (doc) { if (doc) updateProductRating(doc.product); });
reviewSchema.post('deleteOne', { document: true, query: false }, function () { updateProductRating(this.product); });

module.exports = mongoose.model('Review', reviewSchema);
