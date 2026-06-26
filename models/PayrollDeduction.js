'use strict';
const mongoose = require('mongoose');

const PayrollDeductionSchema = new mongoose.Schema({
  deductionNumber: { type: String, unique: true },
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period:          { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod', required: true },
  payrollRun:      { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' },
  type:            { type: String, enum: ['pf','esi','tds','professional_tax','loan','advance','other'], required: true },
  amount:          { type: Number, required: true, min: 0 },
  description:     { type: String, default: '' },
  referenceId:     { type: mongoose.Schema.Types.ObjectId },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

PayrollDeductionSchema.index({ employee: 1, period: 1 });
PayrollDeductionSchema.index({ payrollRun: 1 });

PayrollDeductionSchema.pre('validate', async function (next) {
  if (this.deductionNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('PayrollDeduction').countDocuments();
  this.deductionNumber = `PDN-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('PayrollDeduction', PayrollDeductionSchema);
