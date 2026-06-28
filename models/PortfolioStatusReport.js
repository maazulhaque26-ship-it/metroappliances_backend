'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioStatusReportSchema = new Schema({
  reportCode:    { type: String, unique: true },
  portfolio:     { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  title:         { type: String, required: true, trim: true },
  reportingPeriod:{ type: String, default: '' },
  overallHealth: { type: String, enum: ['on_track','at_risk','off_track'], default: 'on_track' },
  scheduleHealth:{ type: String, enum: ['green','amber','red'], default: 'green' },
  budgetHealth:  { type: String, enum: ['green','amber','red'], default: 'green' },
  scopeHealth:   { type: String, enum: ['green','amber','red'], default: 'green' },
  summary:       { type: String },
  achievements:  { type: String },
  risksIssues:   { type: String },
  nextSteps:     { type: String },
  preparedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  snapshot:      { type: Schema.Types.Mixed },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

portfolioStatusReportSchema.index({ portfolio: 1, createdAt: -1 });

portfolioStatusReportSchema.pre('validate', async function (next) {
  if (!this.reportCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PortfolioStatusReport').countDocuments();
    this.reportCode = `PSR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PortfolioStatusReport', portfolioStatusReportSchema);
