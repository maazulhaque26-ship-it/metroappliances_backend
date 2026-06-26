'use strict';
const mongoose = require('mongoose');

const PayrollEmployeeSchema = new mongoose.Schema({
  payrollRun:          { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
  employee:            { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period:              { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod', required: true },
  employeeSalary:      { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeSalary' },
  // Working days
  workingDays:         { type: Number, default: 0 },
  presentDays:         { type: Number, default: 0 },
  paidDays:            { type: Number, default: 0 },
  lopDays:             { type: Number, default: 0 },
  // Earnings
  basicSalary:         { type: Number, default: 0 },
  hra:                 { type: Number, default: 0 },
  travelAllowance:     { type: Number, default: 0 },
  medicalAllowance:    { type: Number, default: 0 },
  specialAllowance:    { type: Number, default: 0 },
  otherAllowances:     { type: Number, default: 0 },
  overtimePay:         { type: Number, default: 0 },
  bonusAmount:         { type: Number, default: 0 },
  incentiveAmount:     { type: Number, default: 0 },
  grossEarnings:       { type: Number, default: 0 },
  // Deductions
  employeePF:          { type: Number, default: 0 },
  employeeESI:         { type: Number, default: 0 },
  tds:                 { type: Number, default: 0 },
  professionalTax:     { type: Number, default: 0 },
  loanDeduction:       { type: Number, default: 0 },
  advanceDeduction:    { type: Number, default: 0 },
  otherDeductions:     { type: Number, default: 0 },
  totalDeductions:     { type: Number, default: 0 },
  // Employer contributions
  employerPF:          { type: Number, default: 0 },
  employerESI:         { type: Number, default: 0 },
  // Net pay
  netPay:              { type: Number, default: 0 },
  paymentMode:         { type: String, enum: ['bank_transfer','cash','cheque'], default: 'bank_transfer' },
  paymentStatus:       { type: String, enum: ['pending','paid','failed','cancelled'], default: 'pending' },
  paidAt:              { type: Date },
  status:              { type: String, enum: ['draft','calculated','approved','paid','on_hold'], default: 'draft' },
  remarks:             { type: String, default: '' },
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

PayrollEmployeeSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });
PayrollEmployeeSchema.index({ employee: 1, period: 1 });
PayrollEmployeeSchema.index({ payrollRun: 1, status: 1 });

module.exports = mongoose.model('PayrollEmployee', PayrollEmployeeSchema);
