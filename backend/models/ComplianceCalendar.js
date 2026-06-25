'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const complianceEventSchema = new Schema({
  month:       { type: Number, required: true, min: 1, max: 12 },
  dueDay:      { type: Number, required: true, min: 1, max: 31 },
  description: { type: String, trim: true },
}, { _id: false });

const complianceCalendarSchema = new Schema({
  calendarName:  { type: String, required: true, trim: true },
  fiscalYear:    { type: String, required: true, trim: true },
  complianceType:{ type: String, enum: ['GST','TDS','income_tax','ROC','FEMA','customs','other'], required: true },
  events:        [complianceEventSchema],
  applicableTo:  { type: String, enum: ['all','company','individual','partnership'], default: 'all' },
  isActive:      { type: Boolean, default: true },
  createdBy:     { type: ObjectId, ref: 'User' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

complianceCalendarSchema.index({ fiscalYear: 1, complianceType: 1 });
complianceCalendarSchema.index({ isActive: 1 });

module.exports = mongoose.model('ComplianceCalendar', complianceCalendarSchema);
