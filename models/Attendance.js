'use strict';
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  attendanceNumber: { type: String, unique: true },
  employee:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:             { type: Date, required: true },
  policy:           { type: mongoose.Schema.Types.ObjectId, ref: 'AttendancePolicy' },
  // Punch data
  punchIn:          { type: Date },
  punchOut:         { type: Date },
  totalHours:       { type: Number, default: 0 },
  overtimeHours:    { type: Number, default: 0 },
  breakMinutes:     { type: Number, default: 0 },
  effectiveHours:   { type: Number, default: 0 },
  // Status
  status:           { type: String, enum: ['present', 'absent', 'half_day', 'late', 'early_leaving', 'on_leave', 'holiday', 'weekly_off', 'work_from_home'], default: 'absent' },
  isLate:           { type: Boolean, default: false },
  lateByMinutes:    { type: Number, default: 0 },
  isEarlyLeaving:   { type: Boolean, default: false },
  earlyByMinutes:   { type: Number, default: 0 },
  // Leave linkage
  leaveRequest:     { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' },
  // Source
  source:           { type: String, enum: ['device', 'mobile', 'manual', 'system'], default: 'system' },
  remarks:          { type: String, trim: true },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

AttendanceSchema.index({ employee: 1, date: -1 });
AttendanceSchema.index({ date: -1, status: 1 });
AttendanceSchema.index({ employee: 1, status: 1 });
// Unique constraint: one record per employee per day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

AttendanceSchema.pre('validate', async function (next) {
  if (!this.attendanceNumber) {
    const count = await mongoose.model('Attendance').countDocuments();
    const y = new Date().getFullYear();
    this.attendanceNumber = `ATT-${y}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
