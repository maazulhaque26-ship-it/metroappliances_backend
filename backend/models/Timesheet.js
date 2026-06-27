'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const timesheetSchema = new Schema({
  timesheetCode:   { type: String, unique: true },
  employee:        { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  weekStart:       { type: Date, required: true },
  weekEnd:         { type: Date, required: true },
  totalHours:      { type: Number, default: 0 },
  billableHours:   { type: Number, default: 0 },
  status:          { type: String, enum: ['draft','submitted','approved','rejected'], default: 'draft' },
  submittedAt:     { type: Date },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  rejectedReason:  { type: String },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

timesheetSchema.index({ employee: 1, weekStart: 1 });
timesheetSchema.index({ status: 1 });

timesheetSchema.pre('validate', async function (next) {
  if (!this.timesheetCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Timesheet').countDocuments();
    this.timesheetCode = `TMS-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Timesheet', timesheetSchema);
