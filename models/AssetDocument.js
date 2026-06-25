'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetDocumentSchema = new Schema({
  asset:          { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetNumber:    { type: String, default: '' },
  documentType:   { type: String, enum: ['manual','drawing','specification','certificate','warranty','insurance','photo','inspection_report','maintenance_report','purchase_doc','other'], required: true },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  documentNumber: { type: String, default: '' },
  revision:       { type: String, default: 'A' },
  issueDate:      { type: Date },
  expiryDate:     { type: Date },
  fileUrl:        { type: String, default: '' },
  fileSize:       { type: Number, default: 0 },
  fileType:       { type: String, default: '' },
  uploadedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

assetDocumentSchema.index({ asset: 1, documentType: 1 });
assetDocumentSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('AssetDocument', assetDocumentSchema);
