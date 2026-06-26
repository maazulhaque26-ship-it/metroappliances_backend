'use strict';
const mongoose = require('mongoose');

const PayrollAllowanceSchema = new mongoose.Schema({
  allowanceNumber: { type: String, unique: true },
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period:          { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod', required: true },
  payrollRun:      { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' },
  type:            { type: String, enum: ['hra','travel','medical','special','other'], required: true },
  amount:          { type: Number, required: true, min: 0 },
  description:     { type: String, default: '' },
  taxable:         { type: Boolean, default: false },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

PayrollAllowanceSchema.index({ employee: 1, period: 1 });
PayrollAllowanceSchema.index({ payrollRun: 1 });

PayrollAllowanceSchema.pre('validate', async function (next) {
  if (this.allowanceNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('PayrollAllowance').countDocuments();
  this.allowanceNumber = `PAL-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('PayrollAllowance', PayrollAllowanceSchema);
