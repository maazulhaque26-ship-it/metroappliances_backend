'use strict';
const mongoose = require('mongoose');

const employeeBankAccountSchema = new mongoose.Schema({
  employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  accountHolder: { type: String, required: true, trim: true },
  bankName:      { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  ifscCode:      { type: String, required: true, trim: true, uppercase: true },
  accountType:   { type: String, enum: ['savings','current','salary'], default: 'salary' },
  branchName:    { type: String, default: '', trim: true },
  isPrimary:     { type: Boolean, default: false },
  isVerified:    { type: Boolean, default: false },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

employeeBankAccountSchema.index({ employee: 1 });
employeeBankAccountSchema.index({ employee: 1, isPrimary: 1 });

module.exports = mongoose.model('EmployeeBankAccount', employeeBankAccountSchema);
