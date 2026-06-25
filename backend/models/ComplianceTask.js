'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const complianceTaskSchema = new Schema({
  taskNumber:    { type: String, unique: true },
  taskName:      { type: String, required: true, trim: true },
  complianceType:{ type: String, enum: ['GSTR-1','GSTR-3B','GSTR-9','GSTR-9C','TDS_return','TDS_payment','advance_tax','income_tax_return','ROC_filing','other'], required: true },
  period:        { type: String, required: true, trim: true },
  dueDate:       { type: Date, required: true },
  reminderDate:  { type: Date },
  escalationDate:{ type: Date },
  assignedTo:    { type: ObjectId, ref: 'User' },
  completedBy:   { type: ObjectId, ref: 'User' },
  completedDate: { type: Date },
  status:        { type: String, enum: ['pending','in_progress','completed','overdue','waived'], default: 'pending' },
  priority:      { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  notes:         { type: String, trim: true },
  fillingUrl:    { type: String, trim: true },
  acknowledgementNo: { type: String, trim: true },
  lateFee:       { type: Number, default: 0 },
  penaltyAmount: { type: Number, default: 0 },
  complianceCalendar: { type: ObjectId, ref: 'ComplianceCalendar' },
  gstReturn:     { type: ObjectId, ref: 'GSTReturn' },
  tdsDeposit:    { type: ObjectId, ref: 'TDSDeposit' },
  reminderSent:  { type: Boolean, default: false },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

complianceTaskSchema.index({ dueDate: 1, status: 1 });
complianceTaskSchema.index({ complianceType: 1, period: 1 });
complianceTaskSchema.index({ assignedTo: 1, status: 1 });

complianceTaskSchema.pre('validate', async function (next) {
  if (!this.taskNumber) {
    const yr = new Date().getFullYear();
    const prefix = `CMPL-${yr}-`;
    const count = await this.constructor.countDocuments({ taskNumber: { $regex: `^${prefix}` } });
    this.taskNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ComplianceTask', complianceTaskSchema);
