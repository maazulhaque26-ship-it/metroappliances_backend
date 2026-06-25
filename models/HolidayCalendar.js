'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const holidayCalendarSchema = new Schema({
  name:      { type: String, required: true, trim: true },
  date:      { type: Date, required: true },
  type:      { type: String, enum: ['national','regional','factory','maintenance'], default: 'national' },
  factories: [{ type: Schema.Types.ObjectId, ref: 'Factory' }],
  recurring: { type: Boolean, default: false },
  year:      { type: Number, default: () => new Date().getFullYear() },
  notes:     { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

holidayCalendarSchema.index({ date: 1 });
holidayCalendarSchema.index({ year: 1 });
holidayCalendarSchema.index({ type: 1 });
holidayCalendarSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('HolidayCalendar', holidayCalendarSchema);
