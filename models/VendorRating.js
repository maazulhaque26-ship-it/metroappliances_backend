const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorRatingSchema = new Schema({
  vendor:              { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  purchaseOrder:       { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  ratedBy:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ratedByName:         String,
  deliveryRating:      { type: Number, min: 1, max: 5 },
  qualityRating:       { type: Number, min: 1, max: 5 },
  communicationRating: { type: Number, min: 1, max: 5 },
  pricingRating:       { type: Number, min: 1, max: 5 },
  overallRating:       { type: Number, min: 1, max: 5, required: true },
  comments:            String,
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

vendorRatingSchema.index({ vendor: 1, isDeleted: 1 });
vendorRatingSchema.index({ vendor: 1, createdAt: -1 });
vendorRatingSchema.index({ purchaseOrder: 1 });

module.exports = mongoose.model('VendorRating', vendorRatingSchema);
