'use strict';
const mongoose = require('mongoose');

const PayrollAdjustmentSchema = new mongoose.Schema({
  adjustmentNumber: { type: String, unique: true },
  payrollRun:       { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
  employee:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type:             { type: String, enum: ['addition','deduction'], required: true },
  reason:           { type: String, required: true, trim: true },
  amount:           { type: Number, required: true, min: 0 },
  taxable:          { type: Boolean, default: false },
  status:           { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:       { type: Date },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

PayrollAdjustmentSchema.index({ payrollRun: 1 });
PayrollAdjustmentSchema.index({ employee: 1 });

PayrollAdjustmentSchema.pre('validate', async function (next) {
  if (this.adjustmentNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('PayrollAdjustment').countDocuments();
  this.adjustmentNumber = `PAJ-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('PayrollAdjustment', PayrollAdjustmentSchema);
