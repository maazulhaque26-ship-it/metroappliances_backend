'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const revisionHistorySchema = new Schema({
  document:       { type: Schema.Types.ObjectId, ref: 'DocumentControl', required: true },
  documentNumber: { type: String, default: '' },
  revision:       { type: String, required: true },
  revisionType:   { type: String, enum: ['major','minor','editorial','initial'], default: 'minor' },
  changeDescription: { type: String, required: true },
  changedSections:{ type: String, default: '' },
  changeReason:   { type: String, default: '' },
  previousRevision: { type: String, default: '' },
  fileUrl:        { type: String, default: '' },
  preparedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  preparedByName: { type: String, default: '' },
  reviewedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedByName: { type: String, default: '' },
  approvedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName: { type: String, default: '' },
  effectiveDate:  { type: Date, default: Date.now },
  capa:           { type: Schema.Types.ObjectId, ref: 'CAPA' },
  ncReport:       { type: Schema.Types.ObjectId, ref: 'NCReport' },
  auditFinding:   { type: Schema.Types.ObjectId, ref: 'AuditFinding' },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

revisionHistorySchema.index({ document: 1, effectiveDate: -1 });
revisionHistorySchema.index({ document: 1, revision: 1 });

module.exports = mongoose.model('RevisionHistory', revisionHistorySchema);
