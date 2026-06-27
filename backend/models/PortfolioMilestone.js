'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioMilestoneSchema = new Schema({
  milestoneCode: { type: String, unique: true },
  portfolio:     { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  name:          { type: String, required: true, trim: true },
  description:   { type: String },
  type:          { type: String, enum: ['gate','deliverable','decision','review','release'], default: 'deliverable' },
  status:        { type: String, enum: ['pending','at_risk','achieved','missed'], default: 'pending' },
  dueDate:       { type: Date },
  achievedDate:  { type: Date },
  owner:         { type: Schema.Types.ObjectId, ref: 'User' },
  program:       { type: Schema.Types.ObjectId, ref: 'Program' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

portfolioMilestoneSchema.index({ portfolio: 1, status: 1 });

portfolioMilestoneSchema.pre('validate', async function (next) {
  if (!this.milestoneCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PortfolioMilestone').countDocuments();
    this.milestoneCode = `PMS-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PortfolioMilestone', portfolioMilestoneSchema);
