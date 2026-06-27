'use strict';
const mongoose = require('mongoose');

const PMOGovernanceBoardSchema = new mongoose.Schema({
  boardCode:   { type: String, unique: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  boardType:   { type: String, enum: ['portfolio_review', 'program_review', 'project_review', 'investment_committee', 'steering_committee', 'audit_committee', 'risk_committee'], default: 'portfolio_review' },
  status:      { type: String, enum: ['active', 'inactive', 'dissolved'], default: 'active' },
  portfolio:   { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  chair:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members:     [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, default: 'member' } }],
  meetingFrequency: { type: String, enum: ['weekly', 'bi_weekly', 'monthly', 'quarterly', 'ad_hoc'], default: 'monthly' },
  mandate:     { type: String, default: '' },
  decisionAuthority: { type: String, default: '' },
  escalationThreshold: { type: Number, default: 0 },
  nextMeeting: { type: Date },
  lastMeeting:  { type: Date },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

PMOGovernanceBoardSchema.pre('validate', async function (next) {
  if (this.boardCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOGovernanceBoard').findOne({ boardCode: new RegExp(`^GB-${year}-`) }).sort({ boardCode: -1 }).lean();
    const seq = last ? (parseInt(last.boardCode.split('-')[2], 10) + 1) : 1;
    this.boardCode = `GB-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOGovernanceBoard || mongoose.model('PMOGovernanceBoard', PMOGovernanceBoardSchema);
