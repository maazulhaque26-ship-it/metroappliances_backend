'use strict';
const mongoose = require('mongoose');

const EmployeePunchSchema = new mongoose.Schema({
  employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  punchTime:     { type: Date, required: true },
  punchType:     { type: String, enum: ['in', 'out', 'break_start', 'break_end'], required: true },
  device:        { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceDevice' },
  deviceType:    { type: String, enum: ['biometric', 'rfid', 'qr_code', 'face_recognition', 'mobile', 'manual'] },
  latitude:      { type: Number },
  longitude:     { type: Number },
  isManual:      { type: Boolean, default: false },
  manualReason:  { type: String, trim: true },
  recordedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

EmployeePunchSchema.index({ employee: 1, punchTime: -1 });
EmployeePunchSchema.index({ punchTime: -1 });
EmployeePunchSchema.index({ employee: 1, punchType: 1, punchTime: -1 });

module.exports = mongoose.model('EmployeePunch', EmployeePunchSchema);
