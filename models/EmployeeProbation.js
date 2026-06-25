'use strict';
const mongoose = require('mongoose');

const employeeProbationSchema = new mongoose.Schema({
  probationNumber: { type: String, unique: true },
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, required: true },
  durationMonths:  { type: Number, default: 3 },
  status:          { type: String, enum: ['active','extended','confirmed','terminated'], default: 'active' },
  extensionMonths: { type: Number, default: 0 },
  extensionReason: { type: String, default: '' },
  confirmedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt:     { type: Date },
  performanceRating:{ type: Number, min: 1, max: 5 },
  reviewNotes:     { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

employeeProbationSchema.pre('validate', async function (next) {
  if (this.probationNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.probationNumber = `PROB-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

employeeProbationSchema.index({ employee: 1 });
employeeProbationSchema.index({ status: 1 });
employeeProbationSchema.index({ endDate: 1 });

module.exports = mongoose.model('EmployeeProbation', employeeProbationSchema);
