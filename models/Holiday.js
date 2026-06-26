'use strict';
const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  holidayCode:  { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  date:         { type: Date, required: true },
  year:         { type: Number, required: true },
  holidayType:  { type: String, enum: ['national', 'regional', 'optional', 'restricted', 'company'], default: 'company' },
  isOptional:   { type: Boolean, default: false },
  description:  { type: String, trim: true },
  applicableTo: { type: String, enum: ['all', 'department', 'location'], default: 'all' },
  departments:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  locations:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  isRecurring:  { type: Boolean, default: false },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

HolidaySchema.index({ date: 1, isDeleted: 1 });
HolidaySchema.index({ year: 1, isDeleted: 1 });
HolidaySchema.index({ holidayType: 1, year: 1 });

HolidaySchema.pre('validate', async function (next) {
  if (!this.holidayCode) {
    const count = await mongoose.model('Holiday').countDocuments();
    this.holidayCode = `HOL-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.date && !this.year) {
    this.year = new Date(this.date).getFullYear();
  }
  next();
});

module.exports = mongoose.model('Holiday', HolidaySchema);
