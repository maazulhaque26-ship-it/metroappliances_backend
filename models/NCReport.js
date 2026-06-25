'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ncReportSchema = new Schema({
  ncNumber:         { type: String, unique: true },
  ncType:           { type: String, enum: ['minor','major','critical'], required: true },
  title:            { type: String, required: true },
  description:      { type: String, default: '' },
  source:           { type: String, enum: ['incoming_inspection','in_process','final_inspection','customer','audit','surveillance','other'], default: 'in_process' },
  product:          { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:      { type: String, default: '' },
  productSKU:       { type: String, default: '' },
  vendor:           { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName:       { type: String, default: '' },
  purchaseOrder:    { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  workOrder:        { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  inspectionLot:    { type: Schema.Types.ObjectId, ref: 'InspectionLot' },
  factory:          { type: Schema.Types.ObjectId, ref: 'Factory' },
  defectDescription:{ type: String, default: '' },
  defectCategory:   { type: String, enum: ['dimensional','surface','functional','material','assembly','cosmetic','documentation','other'], default: 'other' },
  quantity:         { type: Number, required: true, min: 0.001 },
  unit:             { type: String, default: 'pcs' },
  disposition:      { type: String, enum: ['scrap','rework','use_as_is','return_to_supplier','pending','conditional'], default: 'pending' },
  dispositionBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  dispositionByName:{ type: String, default: '' },
  dispositionNotes: { type: String, default: '' },
  containmentAction:{ type: String, default: '' },
  immediateAction:  { type: String, default: '' },
  capaRequired:     { type: Boolean, default: false },
  capa:             { type: Schema.Types.ObjectId, ref: 'CAPA' },
  status:           { type: String, enum: ['open','under_review','disposition_set','capa_raised','closed','cancelled'], default: 'open' },
  openedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  openedByName:     { type: String, default: '' },
  closedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  closedByName:     { type: String, default: '' },
  closedAt:         { type: Date },
  costImpact:       { type: Number, default: 0 },
  imageUrls:        [{ type: String }],
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

ncReportSchema.index({ status: 1, ncType: 1 });
ncReportSchema.index({ product: 1, status: 1 });
ncReportSchema.index({ vendor: 1, ncType: 1 });
ncReportSchema.index({ factory: 1, createdAt: -1 });

ncReportSchema.pre('validate', async function (next) {
  if (this.isNew && !this.ncNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('NCReport').countDocuments();
    this.ncNumber = `NCR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('NCReport', ncReportSchema);
