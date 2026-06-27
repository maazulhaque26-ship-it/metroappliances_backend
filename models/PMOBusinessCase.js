'use strict';
const mongoose = require('mongoose');

const PMOBusinessCaseSchema = new mongoose.Schema({
  caseCode:           { type: String, unique: true },
  title:              { type: String, required: true, trim: true },
  description:        { type: String, default: '' },
  status:             { type: String, enum: ['draft', 'under_review', 'approved', 'rejected', 'on_hold', 'implemented'], default: 'draft' },
  priority:           { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  portfolio:          { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:            { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  project:            { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  owner:              { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sponsor:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedDate:      { type: Date },
  approvedDate:       { type: Date },
  reviewedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  problemStatement:   { type: String, default: '' },
  proposedSolution:   { type: String, default: '' },
  strategicAlignment: { type: String, default: '' },
  expectedBenefits:   { type: String, default: '' },
  risks:              { type: String, default: '' },
  assumptions:        { type: String, default: '' },
  constraints:        { type: String, default: '' },
  estimatedCost:      { type: Number, default: 0 },
  estimatedBenefit:   { type: Number, default: 0 },
  paybackPeriod:      { type: Number, default: 0 },
  roi:                { type: Number, default: 0 },
  npv:                { type: Number, default: 0 },
  irr:                { type: Number, default: 0 },
  currency:           { type: String, default: 'INR' },
  implementationPlan: { type: String, default: '' },
  successCriteria:    { type: String, default: '' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

PMOBusinessCaseSchema.pre('validate', async function (next) {
  if (this.caseCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOBusinessCase').findOne({ caseCode: new RegExp(`^BC-${year}-`) }).sort({ caseCode: -1 }).lean();
    const seq = last ? (parseInt(last.caseCode.split('-')[2], 10) + 1) : 1;
    this.caseCode = `BC-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOBusinessCase || mongoose.model('PMOBusinessCase', PMOBusinessCaseSchema);
