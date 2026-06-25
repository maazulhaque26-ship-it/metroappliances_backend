'use strict';
const mongoose = require('mongoose');

const AttendanceExceptionSchema = new mongoose.Schema({
  employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  attendance:    { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' },
  date:          { type: Date, required: true },
  exceptionType: { type: String, enum: ['missed_punch_in', 'missed_punch_out', 'both_missing', 'overtime_excess', 'early_departure', 'late_arrival', 'no_break'], required: true },
  details:       { type: String, trim: true },
  isResolved:    { type: Boolean, default: false },
  resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:    { type: Date },
  resolution:    { type: String, trim: true },
}, { timestamps: true });

AttendanceExceptionSchema.index({ employee: 1, date: -1 });
AttendanceExceptionSchema.index({ isResolved: 1, createdAt: -1 });
AttendanceExceptionSchema.index({ exceptionType: 1, isResolved: 1 });

module.exports = mongoose.model('AttendanceException', AttendanceExceptionSchema);
