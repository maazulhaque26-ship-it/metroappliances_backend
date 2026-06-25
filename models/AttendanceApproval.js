'use strict';
const mongoose = require('mongoose');

const AttendanceApprovalSchema = new mongoose.Schema({
  adjustment:   { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceAdjustment', required: true },
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  approver:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:       { type: String, enum: ['approved', 'rejected'], required: true },
  comments:     { type: String, trim: true },
  actionAt:     { type: Date, default: Date.now },
}, { timestamps: true });

AttendanceApprovalSchema.index({ adjustment: 1 });
AttendanceApprovalSchema.index({ employee: 1, actionAt: -1 });
AttendanceApprovalSchema.index({ approver: 1, actionAt: -1 });

module.exports = mongoose.model('AttendanceApproval', AttendanceApprovalSchema);
