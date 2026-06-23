'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const supplierQualityRecordSchema = new Schema({
  recordNumber:     { type: String, unique: true },
  vendor:           { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName:       { type: String, default: '' },
  vendorCode:       { type: String, default: '' },
  recordType:       { type: String, enum: ['evaluation','audit','inspection','complaint','approval','performance_review','rejection'], required: true },
  product:          { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:      { type: String, default: '' },
  purchaseOrder:    { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  poNumber:         { type: String, default: '' },
  inspectionLot:    { type: Schema.Types.ObjectId, ref: 'InspectionLot' },
  qualityAudit:     { type: Schema.Types.ObjectId, ref: 'QualityAudit' },
  recordDate:       { type: Date, default: Date.now },
  // Performance scores (0–100)
  qualityScore:     { type: Number, default: 0, min: 0, max: 100 },
  deliveryScore:    { type: Number, default: 0, min: 0, max: 100 },
  serviceScore:     { type: Number, default: 0, min: 0, max: 100 },
  overallScore:     { type: Number, default: 0, min: 0, max: 100 },
  // Qualification
  supplierStatus:   { type: String, enum: ['approved','conditional','probation','suspended','disqualified','under_evaluation'], default: 'under_evaluation' },
  approvalLevel:    { type: String, enum: ['critical','major','minor','standard'], default: 'standard' },
  // Rejection / complaint data
  defectQuantity:   { type: Number, default: 0 },
  defectDescription:{ type: String, default: '' },
  defectCategory:   { type: String, enum: ['dimensional','surface','functional','material','documentation','packaging','other'], default: 'other' },
  disposition:      { type: String, enum: ['accepted','returned','reworked','scrapped','pending'], default: 'pending' },
  capaRequired:     { type: Boolean, default: false },
  capa:             { type: Schema.Types.ObjectId, ref: 'CAPA' },
  correctiveActionDue: { type: Date },
  reviewedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedByName:   { type: String, default: '' },
  status:           { type: String, enum: ['open','in_review','closed'], default: 'open' },
  notes:            { type: String, default: '' },
  documentUrls:     [{ type: String }],
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

supplierQualityRecordSchema.index({ vendor: 1, recordType: 1 });
supplierQualityRecordSchema.index({ vendor: 1, recordDate: -1 });
supplierQualityRecordSchema.index({ supplierStatus: 1 });
supplierQualityRecordSchema.index({ product: 1, recordType: 1 });

supplierQualityRecordSchema.pre('validate', async function (next) {
  if (this.isNew && !this.recordNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('SupplierQualityRecord').countDocuments();
    this.recordNumber = `SQR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SupplierQualityRecord', supplierQualityRecordSchema);
