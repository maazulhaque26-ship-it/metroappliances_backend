'use strict';
const mongoose = require('mongoose');

const PMOComplianceItemSchema = new mongoose.Schema({
  complianceCode:  { type: String, unique: true },
  title:           { type: String, required: true, trim: true },
  description:     { type: String, default: '' },
  category:        { type: String, enum: ['regulatory', 'policy', 'standard', 'methodology', 'process', 'reporting', 'other'], default: 'policy' },
  framework:       { type: String, default: '' },
  status:          { type: String, enum: ['compliant', 'non_compliant', 'partially_compliant', 'under_review', 'not_applicable'], default: 'under_review' },
  severity:        { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  portfolio:       { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:         { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  project:         { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  owner:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate:         { type: Date },
  reviewDate:      { type: Date },
  remediationPlan: { type: String, default: '' },
  evidenceUrl:     { type: String, default: '' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

PMOComplianceItemSchema.pre('validate', async function (next) {
  if (this.complianceCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOComplianceItem').findOne({ complianceCode: new RegExp(`^CI-${year}-`) }).sort({ complianceCode: -1 }).lean();
    const seq = last ? (parseInt(last.complianceCode.split('-')[2], 10) + 1) : 1;
    this.complianceCode = `CI-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOComplianceItem || mongoose.model('PMOComplianceItem', PMOComplianceItemSchema);
