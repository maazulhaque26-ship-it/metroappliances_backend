'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

// A demand for an employee's time from a project/program within a period.
// Cross-project allocation + conflict detection is computed from these records.
const resourceDemandSchema = new Schema({
  employee:     { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  portfolio:    { type: Schema.Types.ObjectId, ref: 'Portfolio' },
  program:      { type: Schema.Types.ObjectId, ref: 'Program' },
  project:      { type: Schema.Types.ObjectId, ref: 'Project' },
  period:       { type: String, required: true },
  periodType:   { type: String, enum: ['week','month','quarter'], default: 'month' },
  demandHours:  { type: Number, default: 0 },
  role:         { type: String, default: '' },
  priority:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:       { type: String, enum: ['requested','approved','allocated','rejected'], default: 'requested' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

resourceDemandSchema.index({ employee: 1, period: 1 });
resourceDemandSchema.index({ portfolio: 1, period: 1 });
resourceDemandSchema.index({ project: 1 });

module.exports = mongoose.model('ResourceDemand', resourceDemandSchema);
