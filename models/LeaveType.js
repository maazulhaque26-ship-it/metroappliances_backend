'use strict';
const mongoose = require('mongoose');

const LeaveTypeSchema = new mongoose.Schema({
  code:              { type: String, required: true, unique: true, trim: true },
  name:              { type: String, required: true, trim: true },
  description:       { type: String, trim: true },
  isPaid:            { type: Boolean, default: true },
  isCarryForward:    { type: Boolean, default: false },
  maxCarryForward:   { type: Number, default: 0 },
  maxConsecutiveDays:{ type: Number, default: 0 },
  allowHalfDay:      { type: Boolean, default: true },
  requireApproval:   { type: Boolean, default: true },
  requireDocuments:  { type: Boolean, default: false },
  noticeDaysRequired:{ type: Number, default: 0 },
  gender:            { type: String, enum: ['all', 'male', 'female'], default: 'all' },
  minServiceDays:    { type: Number, default: 0 },
  encashable:        { type: Boolean, default: false },
  maxEncashableDays: { type: Number, default: 0 },
  color:             { type: String, default: '#4F46E5' },
  isActive:          { type: Boolean, default: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

LeaveTypeSchema.index({ code: 1 });
LeaveTypeSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('LeaveType', LeaveTypeSchema);
