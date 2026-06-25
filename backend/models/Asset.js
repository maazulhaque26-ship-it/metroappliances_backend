'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetSchema = new Schema({
  assetNumber:     { type: String, unique: true },
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  assetCategory:   { type: Schema.Types.ObjectId, ref: 'AssetCategory' },
  assetCategoryName: { type: String, default: '' },
  assetType:       { type: String, enum: ['equipment','machinery','vehicle','building','infrastructure','it_asset','tool','fixture','other'], required: true },
  make:            { type: String, default: '' },
  model:           { type: String, default: '' },
  manufacturer:    { type: String, default: '' },
  serialNumber:    { type: String, default: '' },
  partNumber:      { type: String, default: '' },
  // Location
  location:        { type: Schema.Types.ObjectId, ref: 'AssetLocation' },
  locationName:    { type: String, default: '' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  department:      { type: String, default: '' },
  // Hierarchy
  parentAsset:     { type: Schema.Types.ObjectId, ref: 'Asset' },
  // Linkage to MES machine
  machine:         { type: Schema.Types.ObjectId, ref: 'Machine' },
  // Barcode linkage (Sprint 10E)
  barcode:         { type: Schema.Types.ObjectId, ref: 'Barcode' },
  barcodeValue:    { type: String, default: '' },
  // Status
  status:          { type: String, enum: ['active','inactive','under_maintenance','breakdown','disposed','standby','transferred'], default: 'active' },
  condition:       { type: String, enum: ['excellent','good','fair','poor','critical'], default: 'good' },
  criticality:     { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  // Financial
  purchaseDate:    { type: Date },
  purchaseCost:    { type: Number, default: 0 },
  currentValue:    { type: Number, default: 0 },
  replacementCost: { type: Number, default: 0 },
  currency:        { type: String, default: 'INR' },
  // Lifecycle
  commissionDate:  { type: Date },
  expectedLife:    { type: Number, default: 0 },  // years
  decommissionDate:{ type: Date },
  // Maintenance
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  maintenanceCost:     { type: Number, default: 0 },
  // Health & reliability
  healthScore:     { type: Number, default: 100, min: 0, max: 100 },
  riskScore:       { type: Number, default: 0, min: 0, max: 100 },
  mtbf:            { type: Number, default: 0 },   // hours
  mttr:            { type: Number, default: 0 },   // hours
  // Custodian
  assignedTo:      { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:  { type: String, default: '' },
  vendor:          { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName:      { type: String, default: '' },
  // Tags
  tags:            [{ type: String }],
  imageUrl:        { type: String, default: '' },
  qrCode:          { type: String, default: '' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

assetSchema.index({ assetCategory: 1, status: 1 });
assetSchema.index({ factory: 1, status: 1 });
assetSchema.index({ location: 1, status: 1 });
assetSchema.index({ parentAsset: 1 });
assetSchema.index({ status: 1, criticality: 1 });
assetSchema.index({ nextMaintenanceDate: 1, status: 1 });

assetSchema.pre('validate', async function (next) {
  if (this.isNew && !this.assetNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('Asset').countDocuments();
    this.assetNumber = `AST-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
