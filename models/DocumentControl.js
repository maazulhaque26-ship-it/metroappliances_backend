'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const documentControlSchema = new Schema({
  documentNumber:   { type: String, unique: true },
  title:            { type: String, required: true },
  documentType:     { type: String, enum: ['procedure','work_instruction','policy','specification','form','record','drawing','standard','manual','other'], required: true },
  category:         { type: String, enum: ['quality','production','safety','environment','hr','finance','customer','supplier','other'], default: 'quality' },
  description:      { type: String, default: '' },
  scope:            { type: String, default: '' },
  currentRevision:  { type: String, default: 'A' },
  status:           { type: String, enum: ['draft','under_review','approved','active','obsolete','superseded'], default: 'draft' },
  effectiveDate:    { type: Date },
  reviewDate:       { type: Date },
  expiryDate:       { type: Date },
  standard:         { type: String, default: '' },
  clause:           { type: String, default: '' },
  // Ownership
  owner:            { type: Schema.Types.ObjectId, ref: 'User' },
  ownerName:        { type: String, default: '' },
  preparedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  preparedByName:   { type: String, default: '' },
  reviewedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedByName:   { type: String, default: '' },
  approvedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:   { type: String, default: '' },
  approvedAt:       { type: Date },
  // File
  fileUrl:          { type: String, default: '' },
  fileSize:         { type: Number, default: 0 },
  fileType:         { type: String, default: '' },
  // Control
  controlledCopy:   { type: Boolean, default: true },
  distributionList: [{ name: String, email: String, role: String }],
  relatedDocuments: [{ type: Schema.Types.ObjectId, ref: 'DocumentControl' }],
  tags:             [{ type: String }],
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

documentControlSchema.index({ documentType: 1, status: 1 });
documentControlSchema.index({ category: 1, status: 1 });
documentControlSchema.index({ reviewDate: 1, status: 1 });
documentControlSchema.index({ owner: 1 });

documentControlSchema.pre('validate', async function (next) {
  if (this.isNew && !this.documentNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('DocumentControl').countDocuments();
    this.documentNumber = `DOC-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('DocumentControl', documentControlSchema);
