'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectCalendarSchema = new Schema({
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title:       { type: String, required: true, trim: true },
  type:        { type: String, enum: ['event','holiday','deadline','meeting','milestone'], default: 'event' },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },
  allDay:      { type: Boolean, default: false },
  description: { type: String },
  attendees:   [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  location:    { type: String },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

projectCalendarSchema.index({ project: 1, startDate: 1 });

module.exports = mongoose.model('ProjectCalendar', projectCalendarSchema);
