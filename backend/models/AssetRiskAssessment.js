'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetRiskAssessmentSchema = new Schema({
  assessmentNumber: { type: String, unique: true },
  asset:            { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:        { type: String, default: '' },
  assessmentDate:   { type: Date, required: true },
  nextAssessmentDate: { type: Date },
  assessedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  assessedByName:   { type: String, default: '' },
  // Risk factors (1-5 scale)
  failureLikelihood:  { type: Number, default: 1, min: 1, max: 5 },
  failureConsequence: { type: Number, default: 1, min: 1, max: 5 },
  productionImpact:   { type: Number, default: 1, min: 1, max: 5 },
  safetyImpact:       { type: Number, default: 1, min: 1, max: 5 },
  environmentImpact:  { type: Number, default: 1, min: 1, max: 5 },
  // Calculated scores
  riskScore:        { type: Number, default: 0 },  // likelihood × consequence
  overallRisk:      { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  // Criticality
  criticalityRating:{ type: String, enum: ['non_critical','semi_critical','critical','mission_critical'], default: 'non_critical' },
  // Mitigation
  existingControls: { type: String, default: '' },
  mitigationActions: [{ action: String, owner: String, dueDate: Date, status: { type: String, default: 'open' } }],
  residualRisk:     { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  // Maintenance strategy recommendation
  maintenanceStrategy: { type: String, enum: ['run_to_failure','preventive','predictive','proactive','redesign'], default: 'preventive' },
  status:           { type: String, enum: ['draft','active','superseded'], default: 'draft' },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

assetRiskAssessmentSchema.index({ asset: 1, assessmentDate: -1 });
assetRiskAssessmentSchema.index({ overallRisk: 1, status: 1 });

assetRiskAssessmentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.assessmentNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('AssetRiskAssessment').countDocuments();
    this.assessmentNumber = `ARA-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetRiskAssessment', assetRiskAssessmentSchema);
