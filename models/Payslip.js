'use strict';
const mongoose = require('mongoose');

const PayslipSchema = new mongoose.Schema({
  payslipNumber:   { type: String, unique: true },
  payrollRun:      { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  payrollEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollEmployee', required: true },
  period:          { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod', required: true },
  generatedAt:     { type: Date },
  emailSentAt:     { type: Date },
  isPublished:     { type: Boolean, default: false },
  publishedAt:     { type: Date },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

PayslipSchema.index({ employee: 1, period: 1 });
PayslipSchema.index({ payrollRun: 1 });
PayslipSchema.index({ employee: 1, payrollRun: 1 }, { unique: true });

PayslipSchema.pre('validate', async function (next) {
  if (this.payslipNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('Payslip').countDocuments();
  this.payslipNumber = `PSP-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Payslip', PayslipSchema);
