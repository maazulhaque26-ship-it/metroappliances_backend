'use strict';
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  loanNumber:        { type: String, unique: true },
  employee:          { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  loanType:          { type: String, enum: ['personal','home','vehicle','education','emergency','other'], required: true },
  principal:         { type: Number, required: true, min: 1 },
  interestRate:      { type: Number, default: 0 },
  tenure:            { type: Number, required: true, min: 1 },
  emi:               { type: Number, default: 0 },
  disbursedAmount:   { type: Number, default: 0 },
  outstandingBalance:{ type: Number, default: 0 },
  totalPaid:         { type: Number, default: 0 },
  disbursementDate:  { type: Date },
  firstEmiDate:      { type: Date },
  status:            { type: String, enum: ['applied','approved','disbursed','active','closed','rejected','cancelled'], default: 'applied' },
  approvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:        { type: Date },
  reason:            { type: String, default: '', trim: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

LoanSchema.index({ employee: 1, status: 1 });

LoanSchema.pre('validate', async function (next) {
  if (this.loanNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('Loan').countDocuments();
  this.loanNumber = `LON-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Loan', LoanSchema);
