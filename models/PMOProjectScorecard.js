'use strict';
const mongoose = require('mongoose');

const dimensionSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  weight: { type: Number, default: 1, min: 0, max: 10 },
  score:  { type: Number, default: 0, min: 0, max: 100 },
  rag:    { type: String, enum: ['green', 'amber', 'red', 'not_assessed'], default: 'not_assessed' },
  notes:  { type: String, default: '' },
}, { _id: true });

const PMOProjectScorecardSchema = new mongoose.Schema({
  scorecardCode:  { type: String, unique: true },
  project:        { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  portfolio:      { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:        { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  period:         { type: String, required: true },
  periodType:     { type: String, enum: ['weekly', 'monthly', 'quarterly'], default: 'monthly' },
  assessedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  overallScore:   { type: Number, default: 0, min: 0, max: 100 },
  overallHealth:  { type: String, enum: ['green', 'amber', 'red', 'not_assessed'], default: 'not_assessed' },
  dimensions:     [dimensionSchema],
  scheduleVariance: { type: Number, default: 0 },
  costVariance:   { type: Number, default: 0 },
  spi:            { type: Number, default: 1 },
  cpi:            { type: Number, default: 1 },
  ev:             { type: Number, default: 0 },
  pv:             { type: Number, default: 0 },
  ac:             { type: Number, default: 0 },
  bac:            { type: Number, default: 0 },
  eac:            { type: Number, default: 0 },
  etc:            { type: Number, default: 0 },
  narrative:      { type: String, default: '' },
  keyAchievements: { type: String, default: '' },
  keyRisks:       { type: String, default: '' },
  nextSteps:      { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

PMOProjectScorecardSchema.pre('validate', async function (next) {
  if (this.scorecardCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOProjectScorecard').findOne({ scorecardCode: new RegExp(`^PSC-${year}-`) }).sort({ scorecardCode: -1 }).lean();
    const seq = last ? (parseInt(last.scorecardCode.split('-')[2], 10) + 1) : 1;
    this.scorecardCode = `PSC-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

PMOProjectScorecardSchema.pre('save', function (next) {
  if (this.dimensions && this.dimensions.length > 0) {
    const totalWeight = this.dimensions.reduce((s, d) => s + (d.weight || 1), 0);
    this.overallScore = totalWeight > 0
      ? Math.round(this.dimensions.reduce((s, d) => s + (d.score * (d.weight || 1)), 0) / totalWeight)
      : 0;
    if (this.overallScore >= 75) this.overallHealth = 'green';
    else if (this.overallScore >= 50) this.overallHealth = 'amber';
    else this.overallHealth = 'red';
  }
  next();
});

module.exports = mongoose.models.PMOProjectScorecard || mongoose.model('PMOProjectScorecard', PMOProjectScorecardSchema);
