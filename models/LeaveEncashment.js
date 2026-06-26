'use strict';
const mongoose = require('mongoose');

const LeaveEncashmentSchema = new mongoose.Schema({
  encashmentNumber: { type: String, unique: true },
  employee:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:        { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  year:             { type: Number, required: true },
  requestedDays:    { type: Number, required: true, min: 1 },
  approvedDays:     { type: Number, default: 0 },
  perDayAmount:     { type: Number, default: 0 },
  totalAmount:      { type: Number, default: 0 },
  status:           { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  requestedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:       { type: Date },
  paidOn:           { type: Date },
  rejectionReason:  { type: String, trim: true },
  notes:            { type: String, trim: true },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

LeaveEncashmentSchema.index({ employee: 1, year: 1 });
LeaveEncashmentSchema.index({ status: 1, createdAt: -1 });

LeaveEncashmentSchema.pre('validate', async function (next) {
  if (!this.encashmentNumber) {
    const count = await mongoose.model('LeaveEncashment').countDocuments();
    const y = new Date().getFullYear();
    this.encashmentNumber = `LENC-${y}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('LeaveEncashment', LeaveEncashmentSchema);
