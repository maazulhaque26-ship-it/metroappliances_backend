'use strict';
const mongoose = require('mongoose');

const LoanRepaymentSchema = new mongoose.Schema({
  repaymentNumber:   { type: String, unique: true },
  loan:              { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  employee:          { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  installmentNumber: { type: Number, required: true },
  dueDate:           { type: Date, required: true },
  principal:         { type: Number, required: true, min: 0 },
  interest:          { type: Number, default: 0 },
  totalAmount:       { type: Number, required: true, min: 0 },
  paidAmount:        { type: Number, default: 0 },
  payrollRun:        { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' },
  period:            { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod' },
  status:            { type: String, enum: ['pending','partial','paid','overdue','waived'], default: 'pending' },
  paidAt:            { type: Date },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

LoanRepaymentSchema.index({ loan: 1, installmentNumber: 1 });
LoanRepaymentSchema.index({ employee: 1, dueDate: 1 });

LoanRepaymentSchema.pre('validate', async function (next) {
  if (this.repaymentNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('LoanRepayment').countDocuments();
  this.repaymentNumber = `LRP-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('LoanRepayment', LoanRepaymentSchema);
