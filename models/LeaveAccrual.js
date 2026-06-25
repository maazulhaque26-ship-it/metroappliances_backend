'use strict';
const mongoose = require('mongoose');

const LeaveAccrualSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:   { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  year:        { type: Number, required: true },
  month:       { type: Number, required: true, min: 1, max: 12 },
  days:        { type: Number, required: true, min: 0 },
  accrualType: { type: String, enum: ['monthly', 'quarterly', 'annual', 'manual'], default: 'monthly' },
  processedAt: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:       { type: String, trim: true },
}, { timestamps: true });

LeaveAccrualSchema.index({ employee: 1, leaveType: 1, year: 1, month: 1 }, { unique: true });
LeaveAccrualSchema.index({ year: 1, month: 1 });

module.exports = mongoose.model('LeaveAccrual', LeaveAccrualSchema);
