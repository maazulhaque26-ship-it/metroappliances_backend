'use strict';
const mongoose = require('mongoose');

const EmployeeSalarySchema = new mongoose.Schema({
  employee:              { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  structure:             { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
  effectiveFrom:         { type: Date, required: true },
  effectiveTo:           { type: Date },
  ctc:                   { type: Number, default: 0 },
  basicSalary:           { type: Number, default: 0 },
  hra:                   { type: Number, default: 0 },
  travelAllowance:       { type: Number, default: 0 },
  medicalAllowance:      { type: Number, default: 0 },
  specialAllowance:      { type: Number, default: 0 },
  pfApplicable:          { type: Boolean, default: true },
  esiApplicable:         { type: Boolean, default: true },
  ptApplicable:          { type: Boolean, default: true },
  paymentMode:           { type: String, enum: ['bank_transfer','cash','cheque'], default: 'bank_transfer' },
  bankAccountNumber:     { type: String, default: '' },
  bankName:              { type: String, default: '' },
  ifscCode:              { type: String, default: '' },
  isActive:              { type: Boolean, default: true },
  isDeleted:             { type: Boolean, default: false },
}, { timestamps: true });

EmployeeSalarySchema.index({ employee: 1, isActive: 1, isDeleted: 1 });
EmployeeSalarySchema.index({ effectiveFrom: -1 });

module.exports = mongoose.model('EmployeeSalary', EmployeeSalarySchema);
