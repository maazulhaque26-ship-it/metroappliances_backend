const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorCategorySchema = new Schema({
  vendor:        { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  category:      { type: Schema.Types.ObjectId, ref: 'Category' },
  categoryName:  { type: String, trim: true }, // denormalized fallback
  isPrimary:     { type: Boolean, default: false },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

vendorCategorySchema.index({ vendor: 1, isDeleted: 1 });
vendorCategorySchema.index({ category: 1 });

module.exports = mongoose.model('VendorCategory', vendorCategorySchema);
