'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioKPISchema = new Schema({
  portfolio:     { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  name:          { type: String, required: true, trim: true },
  category:      { type: String, enum: ['financial','schedule','quality','resource','strategic','benefit'], default: 'financial' },
  unit:          { type: String, default: '' },
  targetValue:   { type: Number, default: 0 },
  actualValue:   { type: Number, default: 0 },
  thresholdGreen:{ type: Number, default: 90 },
  thresholdAmber:{ type: Number, default: 70 },
  direction:     { type: String, enum: ['higher_better','lower_better'], default: 'higher_better' },
  period:        { type: String, default: '' },
  status:        { type: String, enum: ['green','amber','red','no_data'], default: 'no_data' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

portfolioKPISchema.index({ portfolio: 1, category: 1 });

// Compute attainment-based RAG status before save.
portfolioKPISchema.pre('save', function (next) {
  if (this.targetValue && this.targetValue !== 0) {
    let attainment;
    if (this.direction === 'lower_better') {
      attainment = (this.targetValue / (this.actualValue || this.targetValue)) * 100;
    } else {
      attainment = (this.actualValue / this.targetValue) * 100;
    }
    if (attainment >= this.thresholdGreen) this.status = 'green';
    else if (attainment >= this.thresholdAmber) this.status = 'amber';
    else this.status = 'red';
  } else {
    this.status = 'no_data';
  }
  next();
});

module.exports = mongoose.model('PortfolioKPI', portfolioKPISchema);
