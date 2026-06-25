'use strict';
const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  requestNumber:  { type: String, unique: true },
  employee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:      { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  startDate:      { type: Date, required: true },
  endDate:        { type: Date, required: true },
  totalDays:      { type: Number, required: true, min: 0.5 },
  isHalfDay:      { type: Boolean, default: false },
  halfDaySession: { type: String, enum: ['morning', 'afternoon'] },
  reason:         { type: String, required: true, trim: true },
  documentUrl:    { type: String, trim: true },
  status:         { type: String, enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'withdrawn'], default: 'pending' },
  appliedOn:      { type: Date, default: Date.now },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:     { type: Date },
  rejectionReason:{ type: String, trim: true },
  cancelledOn:    { type: Date },
  cancelReason:   { type: String, trim: true },
  notifyManager:  { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

LeaveRequestSchema.index({ employee: 1, startDate: -1 });
LeaveRequestSchema.index({ status: 1, appliedOn: -1 });
LeaveRequestSchema.index({ leaveType: 1, status: 1 });
LeaveRequestSchema.index({ employee: 1, status: 1 });

LeaveRequestSchema.pre('validate', async function (next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('LeaveRequest').countDocuments();
    const y = new Date().getFullYear();
    this.requestNumber = `LR-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
