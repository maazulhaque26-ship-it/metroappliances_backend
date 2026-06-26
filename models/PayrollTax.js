'use strict';
const mongoose = require('mongoose');

const PayrollTaxSchema = new mongoose.Schema({
  taxRecordNumber:      { type: String, unique: true },
  employee:             { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period:               { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod', required: true },
  payrollRun:           { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' },
  fiscalYear:           { type: String, default: '' },
  // TDS
  grossTaxableIncome:   { type: Number, default: 0 },
  standardDeduction:    { type: Number, default: 75000 },
  tdsDeductible:        { type: Number, default: 0 },
  tdsDeducted:          { type: Number, default: 0 },
  // Professional Tax
  ptDeductible:         { type: Number, default: 0 },
  ptDeducted:           { type: Number, default: 0 },
  // PF
  pfDeductible:         { type: Number, default: 0 },
  pfDeducted:           { type: Number, default: 0 },
  employerPF:           { type: Number, default: 0 },
  // ESI
  esiDeductible:        { type: Number, default: 0 },
  esiDeducted:          { type: Number, default: 0 },
  employerESI:          { type: Number, default: 0 },
  isDeleted:            { type: Boolean, default: false },
}, { timestamps: true });

PayrollTaxSchema.index({ employee: 1, period: 1 });
PayrollTaxSchema.index({ payrollRun: 1 });

PayrollTaxSchema.pre('validate', async function (next) {
  if (this.taxRecordNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('PayrollTax').countDocuments();
  this.taxRecordNumber = `TAX-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('PayrollTax', PayrollTaxSchema);
