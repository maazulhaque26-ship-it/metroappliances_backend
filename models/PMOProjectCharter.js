'use strict';
const mongoose = require('mongoose');

const PMOProjectCharterSchema = new mongoose.Schema({
  charterCode:        { type: String, unique: true },
  project:            { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  portfolio:          { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  status:             { type: String, enum: ['draft', 'under_review', 'approved', 'rejected', 'superseded'], default: 'draft' },
  version:            { type: String, default: '1.0' },
  projectManager:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sponsor:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalDate:       { type: Date },
  projectObjectives:  { type: String, default: '' },
  projectScope:       { type: String, default: '' },
  outOfScope:         { type: String, default: '' },
  deliverables:       { type: String, default: '' },
  assumptions:        { type: String, default: '' },
  constraints:        { type: String, default: '' },
  risks:              { type: String, default: '' },
  successCriteria:    { type: String, default: '' },
  budget:             { type: Number, default: 0 },
  currency:           { type: String, default: 'INR' },
  startDate:          { type: Date },
  endDate:            { type: Date },
  stakeholders:       [{ name: String, role: String, interest: String }],
  milestones:         [{ name: String, date: Date, description: String }],
  signoffs:           [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, signedAt: Date, remarks: String }],
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

PMOProjectCharterSchema.pre('validate', async function (next) {
  if (this.charterCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOProjectCharter').findOne({ charterCode: new RegExp(`^PC-${year}-`) }).sort({ charterCode: -1 }).lean();
    const seq = last ? (parseInt(last.charterCode.split('-')[2], 10) + 1) : 1;
    this.charterCode = `PC-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOProjectCharter || mongoose.model('PMOProjectCharter', PMOProjectCharterSchema);
