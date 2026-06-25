'use strict';
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  deptCode:      { type: String, unique: true },
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  businessUnit:  { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
  costCenter:    { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  manager:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  parentDept:    { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  headCount:     { type: Number, default: 0 },
  budget:        { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

departmentSchema.pre('validate', async function (next) {
  if (this.deptCode) return next();
  const count = await this.constructor.countDocuments();
  this.deptCode = `DEPT-${String(count + 1).padStart(4, '0')}`;
  next();
});

departmentSchema.index({ name: 1, isDeleted: 1 });
departmentSchema.index({ businessUnit: 1 });
departmentSchema.index({ manager: 1 });

module.exports = mongoose.model('Department', departmentSchema);
