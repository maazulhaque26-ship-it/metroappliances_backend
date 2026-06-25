'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetFailureAnalysisSchema = new Schema({
  analysisNumber:  { type: String, unique: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  breakdownRecord: { type: Schema.Types.ObjectId, ref: 'BreakdownRecord' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  analysisDate:    { type: Date, required: true },
  analysisMethod:  { type: String, enum: ['fmea','rcfa','5why','fishbone','fault_tree','pareto','other'], required: true },
  failureDescription: { type: String, required: true },
  failureMode:        { type: String, default: '' },
  failureCause:       { type: String, default: '' },
  failureEffect:      { type: String, default: '' },
  // 5 Why
  why1: String, why2: String, why3: String, why4: String, why5: String,
  // FMEA
  severity:        { type: Number, min: 1, max: 10 },
  occurrence:      { type: Number, min: 1, max: 10 },
  detection:       { type: Number, min: 1, max: 10 },
  rpn:             { type: Number, default: 0 },  // severity × occurrence × detection
  // Corrective actions
  correctiveActions: [{ action: String, owner: String, dueDate: Date, status: { type: String, default: 'open' } }],
  preventiveMeasures: { type: String, default: '' },
  // Metrics
  mtbfBefore:      { type: Number, default: 0 },
  mtbfAfter:       { type: Number, default: 0 },
  conductedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  conductedByName: { type: String, default: '' },
  reviewedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedByName:  { type: String, default: '' },
  status:          { type: String, enum: ['draft','in_progress','completed','approved'], default: 'draft' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

assetFailureAnalysisSchema.index({ asset: 1, analysisDate: -1 });
assetFailureAnalysisSchema.index({ analysisMethod: 1 });
assetFailureAnalysisSchema.index({ status: 1 });

assetFailureAnalysisSchema.pre('validate', async function (next) {
  if (this.isNew && !this.analysisNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('AssetFailureAnalysis').countDocuments();
    this.analysisNumber = `AFA-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetFailureAnalysis', assetFailureAnalysisSchema);
