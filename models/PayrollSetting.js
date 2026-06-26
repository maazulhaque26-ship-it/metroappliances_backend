'use strict';
const mongoose = require('mongoose');

const PayrollSettingSchema = new mongoose.Schema({
  organizationName:      { type: String, default: 'Metro Appliances', trim: true },
  pfRate:                { type: Number, default: 12 },
  employerPFRate:        { type: Number, default: 12 },
  esiRate:               { type: Number, default: 0.75 },
  employerESIRate:       { type: Number, default: 3.25 },
  pfWageCeiling:         { type: Number, default: 15000 },
  esiWageCeiling:        { type: Number, default: 21000 },
  professionalTaxState:  { type: String, default: 'Karnataka', trim: true },
  tdsEnabled:            { type: Boolean, default: true },
  payrollCycle:          { type: String, enum: ['monthly','weekly','fortnightly'], default: 'monthly' },
  payDay:                { type: Number, default: 1, min: 1, max: 31 },
  workingDaysPerMonth:   { type: Number, default: 26 },
  lopDeductionBasis:     { type: String, enum: ['calendar_days','working_days'], default: 'working_days' },
  // GL Accounts for payroll posting
  salaryExpenseAccount:  { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  salaryPayableAccount:  { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  pfPayableAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  esiPayableAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  tdsPayableAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  ptPayableAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isDeleted:             { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PayrollSetting', PayrollSettingSchema);
