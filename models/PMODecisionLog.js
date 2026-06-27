'use strict';
const mongoose = require('mongoose');

const PMODecisionLogSchema = new mongoose.Schema({
  decisionCode:   { type: String, unique: true },
  title:          { type: String, required: true, trim: true },
  description:    { type: String, default: '' },
  decisionType:   { type: String, enum: ['investment', 'scope', 'budget', 'resource', 'risk', 'timeline', 'strategic', 'operational', 'other'], default: 'other' },
  status:         { type: String, enum: ['proposed', 'under_review', 'approved', 'rejected', 'deferred', 'implemented'], default: 'proposed' },
  priority:       { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  board:          { type: mongoose.Schema.Types.ObjectId, ref: 'PMOGovernanceBoard' },
  portfolio:      { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:        { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  project:        { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  decisionDate:   { type: Date },
  dueDate:        { type: Date },
  decisionMaker:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rationale:      { type: String, default: '' },
  impact:         { type: String, default: '' },
  alternatives:   { type: String, default: '' },
  actionRequired: { type: String, default: '' },
  owner:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:           [{ type: String }],
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

PMODecisionLogSchema.pre('validate', async function (next) {
  if (this.decisionCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMODecisionLog').findOne({ decisionCode: new RegExp(`^DL-${year}-`) }).sort({ decisionCode: -1 }).lean();
    const seq = last ? (parseInt(last.decisionCode.split('-')[2], 10) + 1) : 1;
    this.decisionCode = `DL-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMODecisionLog || mongoose.model('PMODecisionLog', PMODecisionLogSchema);
