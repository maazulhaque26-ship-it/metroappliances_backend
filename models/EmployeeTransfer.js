'use strict';
const mongoose = require('mongoose');

const employeeTransferSchema = new mongoose.Schema({
  transferNumber:     { type: String, unique: true },
  employee:           { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  transferType:       { type: String, enum: ['department','location','business_unit','designation','reporting_manager'], default: 'department' },
  effectiveDate:      { type: Date, required: true },
  // From
  fromDepartment:     { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  fromDesignation:    { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  fromLocation:       { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  fromBusinessUnit:   { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
  fromReportingManager:{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  // To
  toDepartment:       { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  toDesignation:      { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  toLocation:         { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  toBusinessUnit:     { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
  toReportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  //
  reason:             { type: String, default: '', trim: true },
  status:             { type: String, enum: ['pending','approved','rejected','completed'], default: 'pending' },
  approvedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:         { type: Date },
  initiatedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:              { type: String, default: '' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

employeeTransferSchema.pre('validate', async function (next) {
  if (this.transferNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.transferNumber = `TRF-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

employeeTransferSchema.index({ employee: 1, effectiveDate: -1 });
employeeTransferSchema.index({ status: 1 });
employeeTransferSchema.index({ effectiveDate: -1 });

module.exports = mongoose.model('EmployeeTransfer', employeeTransferSchema);
