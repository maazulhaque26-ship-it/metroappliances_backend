'use strict';
const mongoose = require('mongoose');

const AttendancePolicySchema = new mongoose.Schema({
  policyCode:       { type: String, unique: true },
  name:             { type: String, required: true, trim: true },
  description:      { type: String, trim: true },
  applicableTo:     { type: String, enum: ['all', 'department', 'designation', 'location', 'employee_type'], default: 'all' },
  departments:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  designations:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Designation' }],
  // Work hours
  workingHoursPerDay:  { type: Number, default: 8 },
  workingDaysPerWeek:  { type: Number, default: 5 },
  weeklyOffDays:       [{ type: String, enum: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], default: ['Sunday', 'Saturday'] }],
  // Timing
  shiftStartTime:      { type: String, default: '09:00' },
  shiftEndTime:        { type: String, default: '18:00' },
  graceMinutes:        { type: Number, default: 15 },
  lateMarkAfterMins:   { type: Number, default: 30 },
  halfDayAfterMins:    { type: Number, default: 240 },
  // Overtime
  overtimeEnabled:     { type: Boolean, default: false },
  overtimeMultiplier:  { type: Number, default: 1.5 },
  minOvertimeMins:     { type: Number, default: 60 },
  // Punch rules
  requirePunchIn:      { type: Boolean, default: true },
  requirePunchOut:     { type: Boolean, default: true },
  allowMobileAttendance: { type: Boolean, default: false },
  geoFencingEnabled:   { type: Boolean, default: false },
  geoFenceRadius:      { type: Number, default: 100 },
  geoFenceLatitude:    { type: Number },
  geoFenceLongitude:   { type: Number },
  isDefault:           { type: Boolean, default: false },
  isActive:            { type: Boolean, default: true },
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

AttendancePolicySchema.index({ name: 1, isDeleted: 1 });
AttendancePolicySchema.index({ isDefault: 1 });
AttendancePolicySchema.index({ isActive: 1, isDeleted: 1 });

AttendancePolicySchema.pre('validate', async function (next) {
  if (!this.policyCode) {
    const count = await mongoose.model('AttendancePolicy').countDocuments();
    this.policyCode = `ATPOL-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AttendancePolicy', AttendancePolicySchema);
