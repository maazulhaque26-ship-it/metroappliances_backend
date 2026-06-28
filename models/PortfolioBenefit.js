'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioBenefitSchema = new Schema({
  benefitCode:    { type: String, unique: true },
  portfolio:      { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  name:           { type: String, required: true, trim: true },
  description:    { type: String },
  type:           { type: String, enum: ['financial','non_financial','cost_saving','revenue','productivity','risk_reduction'], default: 'financial' },
  owner:          { type: Schema.Types.ObjectId, ref: 'User' },
  targetValue:    { type: Number, default: 0 },
  realizedValue:  { type: Number, default: 0 },
  unit:           { type: String, default: 'INR' },
  status:         { type: String, enum: ['planned','in_progress','partially_realized','realized','not_realized'], default: 'planned' },
  realizationDate:{ type: Date },
  progress:       { type: Number, min: 0, max: 100, default: 0 },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

portfolioBenefitSchema.index({ portfolio: 1, status: 1 });

portfolioBenefitSchema.pre('validate', async function (next) {
  if (!this.benefitCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PortfolioBenefit').countDocuments();
    this.benefitCode = `BEN-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Derive realization progress from target/realized when not explicitly set.
portfolioBenefitSchema.pre('save', function (next) {
  if (this.targetValue && this.targetValue !== 0) {
    this.progress = Math.min(100, Math.round((this.realizedValue / this.targetValue) * 100));
  }
  next();
});

module.exports = mongoose.model('PortfolioBenefit', portfolioBenefitSchema);
