'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditFindingSchema = new Schema({
  findingNumber:  { type: String, unique: true },
  qualityAudit:   { type: Schema.Types.ObjectId, ref: 'QualityAudit', required: true },
  findingType:    { type: String, enum: ['major_nc','minor_nc','observation','opportunity','strength'], required: true },
  category:       { type: String, enum: ['documentation','process','product','training','equipment','supplier','safety','environment','other'], default: 'process' },
  clause:         { type: String, default: '' },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  evidence:       { type: String, default: '' },
  auditArea:      { type: String, default: '' },
  auditee:        { type: String, default: '' },
  foundBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  foundByName:    { type: String, default: '' },
  status:         { type: String, enum: ['open','accepted','capa_raised','closed','disputed'], default: 'open' },
  capa:           { type: Schema.Types.ObjectId, ref: 'CAPA' },
  proposedCorrection: { type: String, default: '' },
  targetDate:     { type: Date },
  closedDate:     { type: Date },
  closedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  closedByName:   { type: String, default: '' },
  imageUrls:      [{ type: String }],
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

auditFindingSchema.index({ qualityAudit: 1, findingType: 1 });
auditFindingSchema.index({ qualityAudit: 1, status: 1 });
auditFindingSchema.index({ capa: 1 });

auditFindingSchema.pre('validate', async function (next) {
  if (this.isNew && !this.findingNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('AuditFinding').countDocuments();
    this.findingNumber = `AF-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AuditFinding', auditFindingSchema);
