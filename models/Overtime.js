'use strict';
const mongoose = require('mongoose');

const OvertimeSchema = new mongoose.Schema({
  overtimeNumber: { type: String, unique: true },
  employee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:           { type: Date, required: true },
  hours:          { type: Number, required: true, min: 0.5 },
  rate:           { type: Number, required: true, min: 0 },
  amount:         { type: Number, default: 0 },
  overtimeType:   { type: String, enum: ['weekday','weekend','holiday','night_shift'], default: 'weekday' },
  payrollRun:     { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' },
  period:         { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollPeriod' },
  status:         { type: String, enum: ['pending','approved','rejected','paid'], default: 'pending' },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:     { type: Date },
  remarks:        { type: String, default: '', trim: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

OvertimeSchema.index({ employee: 1, date: -1 });
OvertimeSchema.index({ period: 1, status: 1 });

OvertimeSchema.pre('validate', async function (next) {
  if (this.overtimeNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('Overtime').countDocuments();
  this.overtimeNumber = `OVT-${year}-${String(count + 1).padStart(5, '0')}`;
  if (!this.amount) this.amount = (this.hours || 0) * (this.rate || 0);
  next();
});

module.exports = mongoose.model('Overtime', OvertimeSchema);
