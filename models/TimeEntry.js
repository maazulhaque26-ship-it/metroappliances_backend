'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const timeEntrySchema = new Schema({
  project:    { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  task:       { type: Schema.Types.ObjectId, ref: 'ProjectTask' },
  employee:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:       { type: Date, required: true },
  hours:      { type: Number, required: true, min: 0.25, max: 24 },
  description:{ type: String },
  billable:   { type: Boolean, default: true },
  approved:   { type: Boolean, default: false },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  timesheet:  { type: Schema.Types.ObjectId, ref: 'Timesheet' },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

timeEntrySchema.index({ project: 1, employee: 1 });
timeEntrySchema.index({ timesheet: 1 });
timeEntrySchema.index({ date: 1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
