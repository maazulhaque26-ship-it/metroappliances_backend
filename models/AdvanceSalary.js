'use strict';
const mongoose = require('mongoose');

const AdvanceSalarySchema = new mongoose.Schema({
  advanceNumber:             { type: String, unique: true },
  employee:                  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount:                    { type: Number, required: true, min: 1 },
  reason:                    { type: String, required: true, trim: true },
  requestDate:               { type: Date, default: Date.now },
  disbursementDate:          { type: Date },
  recoveryStartPeriod:       { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod' },
  recoveryInstallments:      { type: Number, default: 1, min: 1 },
  recoveryPerInstallment:    { type: Number, default: 0 },
  amountRecovered:           { type: Number, default: 0 },
  balance:                   { type: Number, default: 0 },
  status:                    { type: String, enum: ['applied','approved','disbursed','recovering','recovered','rejected','cancelled'], default: 'applied' },
  approvedBy:                { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:                { type: Date },
  isDeleted:                 { type: Boolean, default: false },
}, { timestamps: true });

AdvanceSalarySchema.index({ employee: 1, status: 1 });

AdvanceSalarySchema.pre('validate', async function (next) {
  if (this.advanceNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('AdvanceSalary').countDocuments();
  this.advanceNumber = `ADV-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('AdvanceSalary', AdvanceSalarySchema);
