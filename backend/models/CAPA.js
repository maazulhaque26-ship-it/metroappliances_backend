'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const capaSchema = new Schema({
  capaNumber:       { type: String, unique: true },
  capaType:         { type: String, enum: ['corrective','preventive','both'], required: true },
  title:            { type: String, required: true },
  description:      { type: String, default: '' },
  source:           { type: String, enum: ['customer_complaint','internal_audit','supplier','inspection','ncr','process','management_review','regulatory','other'], default: 'internal_audit' },
  sourceReference:  { type: String, default: '' },
  ncReport:         { type: Schema.Types.ObjectId, ref: 'NCReport' },
  qualityAudit:     { type: Schema.Types.ObjectId, ref: 'QualityAudit' },
  product:          { type: Schema.Types.ObjectId, ref: 'Product' },
  vendor:           { type: Schema.Types.ObjectId, ref: 'Vendor' },
  factory:          { type: Schema.Types.ObjectId, ref: 'Factory' },
  severity:         { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  priority:         { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  status:           { type: String, enum: ['open','in_progress','action_taken','verification','closed','cancelled'], default: 'open' },
  openedDate:       { type: Date, default: Date.now },
  targetCloseDate:  { type: Date },
  actualCloseDate:  { type: Date },
  openedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  openedByName:     { type: String, default: '' },
  assignedTo:       { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:   { type: String, default: '' },
  problemStatement: { type: String, default: '' },
  immediateAction:  { type: String, default: '' },
  rootCause:        { type: String, default: '' },
  proposedActions:  { type: String, default: '' },
  verificationMethod:     { type: String, default: '' },
  effectivenessReview:    { type: String, default: '' },
  effectivenessStatus:    { type: String, enum: ['pending','effective','partially_effective','not_effective'], default: 'pending' },
  closedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  closedByName:     { type: String, default: '' },
  costOfQuality:    { type: Number, default: 0 },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

capaSchema.index({ status: 1, severity: -1 });
capaSchema.index({ assignedTo: 1, status: 1 });
capaSchema.index({ capaType: 1, status: 1 });
capaSchema.index({ targetCloseDate: 1, status: 1 });

capaSchema.pre('validate', async function (next) {
  if (this.isNew && !this.capaNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('CAPA').countDocuments();
    this.capaNumber = `CAPA-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CAPA', capaSchema);
