'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Approval workflow for portfolio-level decisions (budget, gate, initiative).
const portfolioApprovalSchema = new Schema({
  approvalCode: { type: String, unique: true },
  portfolio:    { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  subject:      { type: String, required: true, trim: true },
  requestType:  { type: String, enum: ['budget','gate','initiative','change_request','closure'], default: 'budget' },
  amount:       { type: Number, default: 0 },
  requestedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  approver:     { type: Schema.Types.ObjectId, ref: 'User' },
  status:       { type: String, enum: ['pending','approved','rejected','escalated'], default: 'pending' },
  priority:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  comments:     { type: String },
  decidedAt:    { type: Date },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

portfolioApprovalSchema.index({ portfolio: 1, status: 1 });

portfolioApprovalSchema.pre('validate', async function (next) {
  if (!this.approvalCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PortfolioApproval').countDocuments();
    this.approvalCode = `APR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PortfolioApproval', portfolioApprovalSchema);
