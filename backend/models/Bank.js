const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  bankCode:    { type: String, required: true, unique: true, trim: true, uppercase: true },
  bankName:    { type: String, required: true, trim: true },
  shortName:   { type: String, trim: true },
  swiftCode:   { type: String, trim: true, uppercase: true },
  country:     { type: String, default: 'India' },
  currency:    { type: String, default: 'INR', uppercase: true },
  website:     { type: String, trim: true },
  contactPhone:{ type: String, trim: true },
  contactEmail:{ type: String, trim: true, lowercase: true },
  isActive:    { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

bankSchema.index({ bankName: 1 });

module.exports = mongoose.model('Bank', bankSchema);
