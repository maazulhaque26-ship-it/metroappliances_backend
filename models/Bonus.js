'use strict';
const mongoose = require('mongoose');

const BonusSchema = new mongoose.Schema({
  bonusNumber:  { type: String, unique: true },
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  bonusType:    { type: String, enum: ['performance','festival','annual','referral','joining','retention','other'], required: true },
  amount:       { type: Number, required: true, min: 0 },
  taxable:      { type: Boolean, default: true },
  payrollRun:   { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' },
  period:       { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod' },
  effectiveDate:{ type: Date, required: true },
  reason:       { type: String, default: '', trim: true },
  status:       { type: String, enum: ['draft','approved','paid','cancelled'], default: 'draft' },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:   { type: Date },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

BonusSchema.index({ employee: 1, status: 1 });
BonusSchema.index({ period: 1 });

BonusSchema.pre('validate', async function (next) {
  if (this.bonusNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('Bonus').countDocuments();
  this.bonusNumber = `BNS-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Bonus', BonusSchema);
