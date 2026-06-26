'use strict';
const mongoose = require('mongoose');

const AttendanceAdjustmentSchema = new mongoose.Schema({
  adjustmentNumber: { type: String, unique: true },
  attendance:       { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', required: true },
  employee:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:             { type: Date, required: true },
  adjustmentType:   { type: String, enum: ['punch_in', 'punch_out', 'status_change', 'hours_correction', 'overtime_addition'], required: true },
  originalValue:    { type: mongoose.Schema.Types.Mixed },
  requestedValue:   { type: mongoose.Schema.Types.Mixed },
  reason:           { type: String, required: true, trim: true },
  status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:       { type: Date },
  rejectionReason:  { type: String, trim: true },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

AttendanceAdjustmentSchema.index({ employee: 1, date: -1 });
AttendanceAdjustmentSchema.index({ status: 1, createdAt: -1 });
AttendanceAdjustmentSchema.index({ attendance: 1 });

AttendanceAdjustmentSchema.pre('validate', async function (next) {
  if (!this.adjustmentNumber) {
    const count = await mongoose.model('AttendanceAdjustment').countDocuments();
    const y = new Date().getFullYear();
    this.adjustmentNumber = `ATADJ-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AttendanceAdjustment', AttendanceAdjustmentSchema);
