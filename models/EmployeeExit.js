'use strict';
const mongoose = require('mongoose');

const employeeExitSchema = new mongoose.Schema({
  exitNumber:      { type: String, unique: true },
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  exitType:        { type: String, enum: ['resignation','termination','retirement','absconding','contract_end','death','voluntary','involuntary'], required: true },
  resignationDate: { type: Date },
  lastWorkingDay:  { type: Date, required: true },
  noticePeriodDays:{ type: Number, default: 30 },
  noticePeriodServed:{ type: Number, default: 0 },
  exitReason:      { type: String, default: '', trim: true },
  exitInterview:   { type: Boolean, default: false },
  exitInterviewNotes:{ type: String, default: '' },
  // Clearance
  itClearance:     { type: Boolean, default: false },
  adminClearance:  { type: Boolean, default: false },
  financeClearance:{ type: Boolean, default: false },
  hrClearance:     { type: Boolean, default: false },
  // Settlement
  settlementAmount:{ type: Number, default: 0 },
  settlementDate:  { type: Date },
  settlementStatus:{ type: String, enum: ['pending','processed','paid'], default: 'pending' },
  //
  status:          { type: String, enum: ['initiated','in_progress','completed','cancelled'], default: 'initiated' },
  processedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt:     { type: Date },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

employeeExitSchema.pre('validate', async function (next) {
  if (this.exitNumber) return next();
  const year  = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.exitNumber = `EXIT-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

employeeExitSchema.index({ employee: 1 });
employeeExitSchema.index({ status: 1 });
employeeExitSchema.index({ lastWorkingDay: -1 });
employeeExitSchema.index({ exitType: 1 });

module.exports = mongoose.model('EmployeeExit', employeeExitSchema);
