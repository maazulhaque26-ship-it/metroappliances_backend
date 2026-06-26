'use strict';
const mongoose = require('mongoose');

const LeavePolicyAllocationSchema = new mongoose.Schema({
  leaveType:  { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  daysPerYear:{ type: Number, required: true, min: 0 },
  accrualType:{ type: String, enum: ['upfront', 'monthly', 'quarterly'], default: 'upfront' },
}, { _id: false });

const LeavePolicySchema = new mongoose.Schema({
  policyCode:   { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  applicableTo: { type: String, enum: ['all', 'department', 'designation', 'employee_type'], default: 'all' },
  departments:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  designations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Designation' }],
  employmentTypes: [{ type: String, enum: ['full_time', 'part_time', 'contract', 'intern'] }],
  allocations:  [LeavePolicyAllocationSchema],
  effectiveFrom:{ type: Date, required: true },
  effectiveTo:  { type: Date },
  isDefault:    { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

LeavePolicySchema.index({ isDefault: 1 });
LeavePolicySchema.index({ isActive: 1, isDeleted: 1 });

LeavePolicySchema.pre('validate', async function (next) {
  if (!this.policyCode) {
    const count = await mongoose.model('LeavePolicy').countDocuments();
    this.policyCode = `LPOL-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('LeavePolicy', LeavePolicySchema);
