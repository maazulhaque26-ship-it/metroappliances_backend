'use strict';
const mongoose = require('mongoose');

const IncentiveSchema = new mongoose.Schema({
  incentiveNumber: { type: String, unique: true },
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  incentiveType:   { type: String, enum: ['sales','target','production','quality','attendance','other'], required: true },
  amount:          { type: Number, required: true, min: 0 },
  targetAchieved:  { type: Number, default: 0 },
  taxable:         { type: Boolean, default: true },
  payrollRun:      { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' },
  period:          { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod' },
  effectiveDate:   { type: Date, required: true },
  reason:          { type: String, default: '', trim: true },
  status:          { type: String, enum: ['draft','approved','paid','cancelled'], default: 'draft' },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

IncentiveSchema.index({ employee: 1, status: 1 });
IncentiveSchema.index({ period: 1 });

IncentiveSchema.pre('validate', async function (next) {
  if (this.incentiveNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('Incentive').countDocuments();
  this.incentiveNumber = `INC-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Incentive', IncentiveSchema);
