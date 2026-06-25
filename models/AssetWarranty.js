'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetWarrantySchema = new Schema({
  warrantyNumber:  { type: String, unique: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  assetNumber:     { type: String, default: '' },
  warrantyType:    { type: String, enum: ['manufacturer','extended','service_contract','parts','labor','comprehensive'], required: true },
  vendor:          { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName:      { type: String, default: '' },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, required: true },
  warrantyDays:    { type: Number, default: 0 },
  // Coverage
  coverageType:    { type: String, default: '' },
  coverageSummary: { type: String, default: '' },
  exclusions:      { type: String, default: '' },
  maxClaimValue:   { type: Number, default: 0 },
  claimsUsed:      { type: Number, default: 0 },
  // Contact
  contactPerson:   { type: String, default: '' },
  contactPhone:    { type: String, default: '' },
  claimEmail:      { type: String, default: '' },
  // Status
  status:          { type: String, enum: ['active','expired','claimed','voided'], default: 'active' },
  documentUrl:     { type: String, default: '' },
  reminderDays:    { type: Number, default: 30 },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

assetWarrantySchema.index({ asset: 1, status: 1 });
assetWarrantySchema.index({ endDate: 1, status: 1 });
assetWarrantySchema.index({ vendor: 1 });

assetWarrantySchema.pre('validate', async function (next) {
  if (this.isNew && !this.warrantyNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('AssetWarranty').countDocuments();
    this.warrantyNumber = `AW-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetWarranty', assetWarrantySchema);
