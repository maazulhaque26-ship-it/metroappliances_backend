const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorBankAccountSchema = new Schema({
  vendor:        { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  accountName:   { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  bankName:      { type: String, required: true, trim: true },
  branch:        { type: String, trim: true },
  ifscCode:      { type: String, trim: true, uppercase: true },
  swiftCode:     { type: String, trim: true, uppercase: true },
  accountType:   { type: String, enum: ['savings', 'current', 'overdraft'], default: 'current' },
  isPrimary:     { type: Boolean, default: false },
  isVerified:    { type: Boolean, default: false },
  verifiedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt:    Date,
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

vendorBankAccountSchema.index({ vendor: 1, isDeleted: 1 });
vendorBankAccountSchema.index({ vendor: 1, isPrimary: 1 });

module.exports = mongoose.model('VendorBankAccount', vendorBankAccountSchema);
