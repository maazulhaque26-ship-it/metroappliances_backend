'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioRiskSchema = new Schema({
  riskCode:     { type: String, unique: true },
  portfolio:    { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String },
  category:     { type: String, enum: ['strategic','financial','operational','compliance','technical','resource','external'], default: 'strategic' },
  probability:  { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  impact:       { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  riskScore:    { type: Number, default: 0 },
  status:       { type: String, enum: ['identified','assessed','mitigated','closed'], default: 'identified' },
  owner:        { type: Schema.Types.ObjectId, ref: 'User' },
  mitigation:   { type: String },
  contingency:  { type: String },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

portfolioRiskSchema.index({ portfolio: 1, status: 1 });

portfolioRiskSchema.pre('validate', async function (next) {
  if (!this.riskCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PortfolioRisk').countDocuments();
    this.riskCode = `RSK-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PortfolioRisk', portfolioRiskSchema);
