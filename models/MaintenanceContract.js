'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceContractSchema = new Schema({
  contractNumber:  { type: String, unique: true },
  title:           { type: String, required: true },
  contractType:    { type: String, enum: ['amc','comprehensive','parts_only','labor_only','inspection','warranty_extension','other'], required: true },
  vendor:          { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName:      { type: String, default: '' },
  // Scope
  coveredAssets:   [{ asset: { type: Schema.Types.ObjectId, ref: 'Asset' }, assetName: String, assetNumber: String }],
  assetCategory:   { type: Schema.Types.ObjectId, ref: 'AssetCategory' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  // Terms
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, required: true },
  contractValue:   { type: Number, default: 0 },
  currency:        { type: String, default: 'INR' },
  paymentTerms:    { type: String, default: '' },
  // SLA
  responseTimeHours:    { type: Number, default: 4 },
  resolutionTimeHours:  { type: Number, default: 24 },
  availabilityPercent:  { type: Number, default: 95 },
  // Status
  status:          { type: String, enum: ['draft','active','expired','terminated','renewed'], default: 'draft' },
  autoRenew:       { type: Boolean, default: false },
  renewalReminderDays: { type: Number, default: 30 },
  // Terms document
  documentUrl:     { type: String, default: '' },
  poNumber:        { type: String, default: '' },
  contactPerson:   { type: String, default: '' },
  contactPhone:    { type: String, default: '' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenanceContractSchema.index({ vendor: 1, status: 1 });
maintenanceContractSchema.index({ status: 1, endDate: 1 });
maintenanceContractSchema.index({ factory: 1, status: 1 });

maintenanceContractSchema.pre('validate', async function (next) {
  if (this.isNew && !this.contractNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceContract').countDocuments();
    this.contractNumber = `MC-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceContract', maintenanceContractSchema);
