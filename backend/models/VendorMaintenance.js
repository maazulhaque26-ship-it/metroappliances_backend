'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorMaintenanceSchema = new Schema({
  serviceNumber:   { type: String, unique: true },
  vendor:          { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName:      { type: String, default: '' },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  assetNumber:     { type: String, default: '' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  maintenanceContract:  { type: Schema.Types.ObjectId, ref: 'MaintenanceContract' },
  serviceType:     { type: String, enum: ['repair','amc_service','inspection','calibration','upgrade','installation','consultation','emergency','warranty_claim'], required: true },
  serviceDate:     { type: Date, required: true },
  completionDate:  { type: Date },
  description:     { type: String, default: '' },
  // Work done
  workPerformed:   { type: String, default: '' },
  partsSupplied:   [{ partName: String, partNumber: String, quantity: Number, unitCost: Number }],
  // Cost breakdown
  laborCost:       { type: Number, default: 0 },
  partsCost:       { type: Number, default: 0 },
  travelCost:      { type: Number, default: 0 },
  totalCost:       { type: Number, default: 0 },
  currency:        { type: String, default: 'INR' },
  invoiceNumber:   { type: String, default: '' },
  invoiceDate:     { type: Date },
  // Service quality
  responseTime:    { type: Number, default: 0 },  // hours from call to arrival
  resolutionTime:  { type: Number, default: 0 },  // hours from arrival to completion
  qualityRating:   { type: Number, min: 1, max: 5, default: 3 },
  technicianName:  { type: String, default: '' },
  technicianContact: { type: String, default: '' },
  // Outcome
  assetConditionAfter: { type: String, enum: ['excellent','good','fair','poor'], default: 'good' },
  warrantyOnWork:  { type: Boolean, default: false },
  warrantyExpiry:  { type: Date },
  followUpRequired:{ type: Boolean, default: false },
  followUpDate:    { type: Date },
  // Approval
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:  { type: String, default: '' },
  status:          { type: String, enum: ['scheduled','in_progress','completed','cancelled','disputed'], default: 'scheduled' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

vendorMaintenanceSchema.index({ vendor: 1, serviceDate: -1 });
vendorMaintenanceSchema.index({ asset: 1, serviceDate: -1 });
vendorMaintenanceSchema.index({ status: 1 });
vendorMaintenanceSchema.index({ maintenanceContract: 1 });

vendorMaintenanceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.serviceNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('VendorMaintenance').countDocuments();
    this.serviceNumber = `VMS-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('VendorMaintenance', vendorMaintenanceSchema);
