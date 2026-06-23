'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionCalendarSchema = new Schema({
  factory:       { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  date:          { type: Date, required: true },
  isWorkingDay:  { type: Boolean, default: true },
  shifts:        [{ type: Schema.Types.ObjectId, ref: 'Shift' }],
  plannedOutput: { type: Number, default: 0, min: 0 },
  actualOutput:  { type: Number, default: 0, min: 0 },
  holiday:       { type: Schema.Types.ObjectId, ref: 'HolidayCalendar', default: null },
  notes:         { type: String, default: '' },
}, { timestamps: true });

productionCalendarSchema.index({ factory: 1, date: 1 }, { unique: true });
productionCalendarSchema.index({ date: 1 });
productionCalendarSchema.index({ isWorkingDay: 1 });

module.exports = mongoose.model('ProductionCalendar', productionCalendarSchema);
