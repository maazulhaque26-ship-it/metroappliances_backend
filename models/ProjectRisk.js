'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PROBABILITY_SCORE = { low: 1, medium: 2, high: 3 };
const IMPACT_SCORE      = { low: 1, medium: 2, high: 3, critical: 4 };

const projectRiskSchema = new Schema({
  riskCode:    { type: String, unique: true },
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  category:    { type: String, enum: ['technical','resource','financial','external','organizational'], default: 'technical' },
  probability: { type: String, enum: ['low','medium','high'], default: 'medium' },
  impact:      { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  riskScore:   { type: Number },
  status:      { type: String, enum: ['identified','assessed','mitigated','closed'], default: 'identified' },
  mitigation:  { type: String },
  contingency: { type: String },
  owner:       { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate:     { type: Date },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

projectRiskSchema.index({ project: 1, status: 1 });

projectRiskSchema.pre('save', function (next) {
  const p = PROBABILITY_SCORE[this.probability] || 2;
  const i = IMPACT_SCORE[this.impact] || 2;
  this.riskScore = p * i;
  next();
});

projectRiskSchema.pre('validate', async function (next) {
  if (!this.riskCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ProjectRisk').countDocuments();
    this.riskCode = `RSK-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProjectRisk', projectRiskSchema);
