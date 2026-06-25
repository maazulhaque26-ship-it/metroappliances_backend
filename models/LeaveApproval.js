'use strict';
const mongoose = require('mongoose');

const LeaveApprovalSchema = new mongoose.Schema({
  leaveRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', required: true },
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  approver:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  level:        { type: Number, default: 1 },
  action:       { type: String, enum: ['approved', 'rejected', 'forwarded'], required: true },
  comments:     { type: String, trim: true },
  actionAt:     { type: Date, default: Date.now },
}, { timestamps: true });

LeaveApprovalSchema.index({ leaveRequest: 1 });
LeaveApprovalSchema.index({ employee: 1, actionAt: -1 });
LeaveApprovalSchema.index({ approver: 1, actionAt: -1 });

module.exports = mongoose.model('LeaveApproval', LeaveApprovalSchema);
