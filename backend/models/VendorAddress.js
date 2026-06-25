const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorAddressSchema = new Schema({
  vendor:       { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  addressType:  { type: String, enum: ['registered', 'billing', 'shipping', 'factory', 'warehouse', 'branch'], default: 'registered' },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  city:         { type: String, required: true, trim: true },
  state:        { type: String, required: true, trim: true },
  country:      { type: String, default: 'India', trim: true },
  pincode:      { type: String, trim: true },
  geoLocation:  {
    lat: { type: Number },
    lng: { type: Number },
  },
  isPrimary:    { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

vendorAddressSchema.index({ vendor: 1, isDeleted: 1 });
vendorAddressSchema.index({ vendor: 1, isPrimary: 1 });

module.exports = mongoose.model('VendorAddress', vendorAddressSchema);
