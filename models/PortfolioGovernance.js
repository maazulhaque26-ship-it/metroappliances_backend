'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Governance gates / stage reviews for a portfolio (e.g., stage-gate reviews).
const portfolioGovernanceSchema = new Schema({
  portfolio:    { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  gateName:     { type: String, required: true, trim: true },
  gateType:     { type: String, enum: ['stage_gate','steering_review','quality_gate','investment_review','closure_review'], default: 'stage_gate' },
  scheduledDate:{ type: Date },
  reviewDate:   { type: Date },
  status:       { type: String, enum: ['scheduled','in_review','passed','passed_with_conditions','failed','deferred'], default: 'scheduled' },
  chair:        { type: Schema.Types.ObjectId, ref: 'User' },
  decision:     { type: String },
  conditions:   { type: String },
  notes:        { type: String },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

portfolioGovernanceSchema.index({ portfolio: 1, status: 1 });

module.exports = mongoose.model('PortfolioGovernance', portfolioGovernanceSchema);
