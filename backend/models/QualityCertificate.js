'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const qualityCertificateSchema = new Schema({
  certificateNumber: { type: String, unique: true },
  certificateType:   { type: String, enum: ['coa','conformance','calibration','test_report','compliance','other'], required: true },
  title:             { type: String, required: true },
  referenceType:     { type: String, enum: ['product','lot','batch','purchase_order','work_order','vendor','gauge'], default: 'product' },
  referenceId:       { type: Schema.Types.ObjectId },
  referenceNumber:   { type: String, default: '' },
  product:           { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:       { type: String, default: '' },
  vendor:            { type: Schema.Types.ObjectId, ref: 'Vendor' },
  inspectionLot:     { type: Schema.Types.ObjectId, ref: 'InspectionLot' },
  batchNumber:       { type: String, default: '' },
  quantity:          { type: Number, default: 0 },
  unit:              { type: String, default: '' },
  issueDate:         { type: Date, default: Date.now },
  expiryDate:        { type: Date },
  validityDays:      { type: Number, default: 365 },
  issuedBy:          { type: Schema.Types.ObjectId, ref: 'User' },
  issuedByName:      { type: String, default: '' },
  approvedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:    { type: String, default: '' },
  status:            { type: String, enum: ['draft','issued','expired','revoked'], default: 'draft' },
  testResults:       [{ parameter: String, result: String, specification: String, status: { type: String, enum: ['pass','fail','na'], default: 'pass' } }],
  documentUrl:       { type: String, default: '' },
  remarks:           { type: String, default: '' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

qualityCertificateSchema.index({ certificateType: 1, status: 1 });
qualityCertificateSchema.index({ product: 1, certificateType: 1 });
qualityCertificateSchema.index({ vendor: 1, issueDate: -1 });
qualityCertificateSchema.index({ expiryDate: 1, status: 1 });

qualityCertificateSchema.pre('validate', async function (next) {
  if (this.isNew && !this.certificateNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('QualityCertificate').countDocuments();
    this.certificateNumber = `QC-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('QualityCertificate', qualityCertificateSchema);
