'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectResourceSchema = new Schema({
  project:      { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  employee:     { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  role:         { type: String },
  skills:       [{ type: String }],
  startDate:    { type: Date },
  endDate:      { type: Date },
  plannedHours: { type: Number, default: 0 },
  actualHours:  { type: Number, default: 0 },
  availability: { type: Number, default: 100 },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

projectResourceSchema.index({ project: 1 });
projectResourceSchema.index({ employee: 1 });

module.exports = mongoose.model('ProjectResource', projectResourceSchema);
