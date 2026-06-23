'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const machineCalendarSchema = new Schema({
  machine:   { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
  factory:   { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  date:      { type: Date, required: true },
  shift:     { type: Schema.Types.ObjectId, ref: 'Shift' },
  available: { type: Boolean, default: true },
  unavailableReason: {
    type: String,
    enum: ['maintenance','breakdown','holiday','scheduled_downtime','operator_unavailable',''],
    default: '',
  },
  plannedHours: { type: Number, default: 0, min: 0 },
  actualHours:  { type: Number, default: 0, min: 0 },
  notes:     { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

machineCalendarSchema.index({ machine: 1, date: 1 }, { unique: true });
machineCalendarSchema.index({ factory: 1, date: 1 });
machineCalendarSchema.index({ available: 1 });

module.exports = mongoose.model('MachineCalendar', machineCalendarSchema);
