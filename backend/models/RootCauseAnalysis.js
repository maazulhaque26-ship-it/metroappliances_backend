'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const rootCauseAnalysisSchema = new Schema({
  rcaNumber:     { type: String, unique: true },
  capa:          { type: Schema.Types.ObjectId, ref: 'CAPA' },
  ncReport:      { type: Schema.Types.ObjectId, ref: 'NCReport' },
  method:        { type: String, enum: ['5why','fishbone','fault_tree','pareto','other'], required: true },
  problemStatement: { type: String, required: true },
  // 5 Why fields
  why1: { type: String, default: '' },
  why2: { type: String, default: '' },
  why3: { type: String, default: '' },
  why4: { type: String, default: '' },
  why5: { type: String, default: '' },
  // Fishbone categories
  fishboneMachine:   { type: String, default: '' },
  fishboneMethod:    { type: String, default: '' },
  fishboneMaterial:  { type: String, default: '' },
  fishboneMan:       { type: String, default: '' },
  fishboneEnvironment: { type: String, default: '' },
  fishboneMeasurement: { type: String, default: '' },
  // Root cause conclusion
  rootCause:     { type: String, default: '' },
  contributingFactors: [{ type: String }],
  status:        { type: String, enum: ['open','in_progress','completed'], default: 'open' },
  conductedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  conductedByName: { type: String, default: '' },
  reviewedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedByName:{ type: String, default: '' },
  completedAt:   { type: Date },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

rootCauseAnalysisSchema.index({ capa: 1 });
rootCauseAnalysisSchema.index({ ncReport: 1 });
rootCauseAnalysisSchema.index({ status: 1 });

rootCauseAnalysisSchema.pre('validate', async function (next) {
  if (this.isNew && !this.rcaNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('RootCauseAnalysis').countDocuments();
    this.rcaNumber = `RCA-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('RootCauseAnalysis', rootCauseAnalysisSchema);
