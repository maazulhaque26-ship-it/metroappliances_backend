'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const calibrationScheduleSchema = new Schema({
  scheduleNumber:   { type: String, unique: true },
  gauge:            { type: Schema.Types.ObjectId, ref: 'Gauge', required: true },
  gaugeName:        { type: String, default: '' },
  gaugeNumber:      { type: String, default: '' },
  scheduledDate:    { type: Date, required: true },
  dueDate:          { type: Date, required: true },
  calibrationMethod:{ type: String, enum: ['internal','external','on_site','laboratory'], default: 'internal' },
  externalVendor:   { type: String, default: '' },
  assignedTo:       { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:   { type: String, default: '' },
  estimatedDuration:{ type: Number, default: 0 }, // minutes
  estimatedCost:    { type: Number, default: 0 },
  status:           { type: String, enum: ['scheduled','in_progress','completed','cancelled','overdue'], default: 'scheduled' },
  completedDate:    { type: Date },
  calibrationRecord:{ type: Schema.Types.ObjectId, ref: 'CalibrationRecord' },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

calibrationScheduleSchema.index({ gauge: 1, scheduledDate: 1 });
calibrationScheduleSchema.index({ scheduledDate: 1, status: 1 });
calibrationScheduleSchema.index({ dueDate: 1, status: 1 });

calibrationScheduleSchema.pre('validate', async function (next) {
  if (this.isNew && !this.scheduleNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('CalibrationSchedule').countDocuments();
    this.scheduleNumber = `CS-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CalibrationSchedule', calibrationScheduleSchema);
