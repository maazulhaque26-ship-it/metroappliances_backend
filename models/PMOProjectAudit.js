'use strict';
const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  area:       { type: String, required: true },
  finding:    { type: String, required: true },
  severity:   { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status:     { type: String, enum: ['open', 'in_progress', 'resolved', 'accepted', 'wont_fix'], default: 'open' },
  recommendation: { type: String, default: '' },
  response:   { type: String, default: '' },
  dueDate:    { type: Date },
}, { _id: true });

const PMOProjectAuditSchema = new mongoose.Schema({
  auditCode:   { type: String, unique: true },
  title:       { type: String, required: true, trim: true },
  auditType:   { type: String, enum: ['schedule', 'budget', 'quality', 'risk', 'process', 'compliance', 'health_check', 'gate_review', 'post_mortem'], default: 'health_check' },
  status:      { type: String, enum: ['planned', 'in_progress', 'completed', 'report_issued', 'closed'], default: 'planned' },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  portfolio:   { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:     { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  auditor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auditee:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auditDate:   { type: Date },
  reportDate:  { type: Date },
  overallRating: { type: String, enum: ['excellent', 'satisfactory', 'needs_improvement', 'unsatisfactory', 'critical'], default: 'satisfactory' },
  summary:     { type: String, default: '' },
  findings:    [findingSchema],
  recommendations: { type: String, default: '' },
  followUpDate:  { type: Date },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

PMOProjectAuditSchema.pre('validate', async function (next) {
  if (this.auditCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOProjectAudit').findOne({ auditCode: new RegExp(`^AUD-${year}-`) }).sort({ auditCode: -1 }).lean();
    const seq = last ? (parseInt(last.auditCode.split('-')[2], 10) + 1) : 1;
    this.auditCode = `AUD-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOProjectAudit || mongoose.model('PMOProjectAudit', PMOProjectAuditSchema);
