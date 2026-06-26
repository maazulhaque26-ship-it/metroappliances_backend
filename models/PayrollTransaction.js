'use strict';
const mongoose = require('mongoose');

const PayrollTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, unique: true },
  payrollRun:        { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
  employee:          { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  payrollEmployee:   { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollEmployee' },
  journalEntry:      { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  amount:            { type: Number, required: true },
  paymentMode:       { type: String, enum: ['bank_transfer','cash','cheque'], default: 'bank_transfer' },
  bankReference:     { type: String, default: '' },
  transactionDate:   { type: Date },
  status:            { type: String, enum: ['pending','processing','completed','failed','cancelled'], default: 'pending' },
  remarks:           { type: String, default: '' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

PayrollTransactionSchema.index({ payrollRun: 1 });
PayrollTransactionSchema.index({ employee: 1, transactionDate: -1 });

PayrollTransactionSchema.pre('validate', async function (next) {
  if (this.transactionNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('PayrollTransaction').countDocuments();
  this.transactionNumber = `PTN-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('PayrollTransaction', PayrollTransactionSchema);
