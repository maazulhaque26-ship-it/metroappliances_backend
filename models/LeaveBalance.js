'use strict';
const mongoose = require('mongoose');

const LeaveBalanceSchema = new mongoose.Schema({
  employee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:      { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  year:           { type: Number, required: true },
  openingBalance: { type: Number, default: 0 },
  accrued:        { type: Number, default: 0 },
  taken:          { type: Number, default: 0 },
  pending:        { type: Number, default: 0 },
  encashed:       { type: Number, default: 0 },
  lapsed:         { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  lastUpdated:    { type: Date, default: Date.now },
}, { timestamps: true });

LeaveBalanceSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });
LeaveBalanceSchema.index({ employee: 1, year: 1 });
LeaveBalanceSchema.index({ leaveType: 1, year: 1 });

module.exports = mongoose.model('LeaveBalance', LeaveBalanceSchema);
