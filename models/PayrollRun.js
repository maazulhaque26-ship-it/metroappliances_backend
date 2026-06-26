'use strict';
const mongoose = require('mongoose');

const PayrollRunSchema = new mongoose.Schema({
  runNumber:       { type: String, unique: true },
  period:          { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod', required: true },
  runType:         { type: String, enum: ['regular','supplementary','correction','off_cycle'], default: 'regular' },
  status:          { type: String, enum: ['draft','calculated','approved','posted','paid'], default: 'draft' },
  totalEmployees:  { type: Number, default: 0 },
  totalGross:      { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  totalNetPay:     { type: Number, default: 0 },
  totalEmployerPF: { type: Number, default: 0 },
  totalEmployerESI:{ type: Number, default: 0 },
  calculatedAt:    { type: Date },
  calculatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt:        { type: Date },
  postedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt:          { type: Date },
  paidBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  journalEntry:    { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  narration:       { type: String, default: '' },
  remarks:         { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

PayrollRunSchema.index({ period: 1, status: 1 });
PayrollRunSchema.index({ status: 1, isDeleted: 1 });

PayrollRunSchema.pre('validate', async function (next) {
  if (this.runNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('PayrollRun').countDocuments();
  this.runNumber = `PRN-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('PayrollRun', PayrollRunSchema);
