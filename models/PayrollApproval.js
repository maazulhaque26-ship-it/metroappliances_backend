'use strict';
const mongoose = require('mongoose');

const PayrollApprovalSchema = new mongoose.Schema({
  payrollRun: { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
  level:      { type: Number, required: true, min: 1 },
  approver:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:     { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  comments:   { type: String, default: '', trim: true },
  actionAt:   { type: Date },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

PayrollApprovalSchema.index({ payrollRun: 1, level: 1 });

module.exports = mongoose.model('PayrollApproval', PayrollApprovalSchema);
