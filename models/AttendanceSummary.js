'use strict';
const mongoose = require('mongoose');

const AttendanceSummarySchema = new mongoose.Schema({
  employee:          { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  year:              { type: Number, required: true },
  month:             { type: Number, required: true, min: 1, max: 12 },
  workingDays:       { type: Number, default: 0 },
  presentDays:       { type: Number, default: 0 },
  absentDays:        { type: Number, default: 0 },
  halfDays:          { type: Number, default: 0 },
  lateDays:          { type: Number, default: 0 },
  earlyLeavingDays:  { type: Number, default: 0 },
  leaveDays:         { type: Number, default: 0 },
  holidayDays:       { type: Number, default: 0 },
  weeklyOffDays:     { type: Number, default: 0 },
  totalHours:        { type: Number, default: 0 },
  overtimeHours:     { type: Number, default: 0 },
  attendancePercent: { type: Number, default: 0 },
  lastComputedAt:    { type: Date, default: Date.now },
}, { timestamps: true });

AttendanceSummarySchema.index({ employee: 1, year: 1, month: 1 }, { unique: true });
AttendanceSummarySchema.index({ year: 1, month: 1 });

module.exports = mongoose.model('AttendanceSummary', AttendanceSummarySchema);
