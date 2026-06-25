const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorContactSchema = new Schema({
  vendor:       { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name:         { type: String, required: true, trim: true },
  designation:  { type: String, trim: true },
  department:   { type: String, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  phone:        { type: String, trim: true },
  mobile:       { type: String, trim: true },
  isPrimary:    { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

vendorContactSchema.index({ vendor: 1, isDeleted: 1 });
vendorContactSchema.index({ vendor: 1, isPrimary: 1 });

module.exports = mongoose.model('VendorContact', vendorContactSchema);
