'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const machineRuntimeSchema = new Schema({
  runtimeNumber:    { type: String, unique: true },
  machine:          { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
  workOrder:        { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  shift:            { type: Schema.Types.ObjectId, ref: 'Shift' },
  factory:          { type: Schema.Types.ObjectId, ref: 'Factory' },
  date:             { type: Date, required: true },
  runtimeMins:      { type: Number, default: 0, min: 0 },
  idleTimeMins:     { type: Number, default: 0, min: 0 },
  downtimeMins:     { type: Number, default: 0, min: 0 },
  setupTimeMins:    { type: Number, default: 0, min: 0 },
  plannedTimeMins:  { type: Number, default: 0, min: 0 },
  cyclesCompleted:  { type: Number, default: 0, min: 0 },
  speedActual:      { type: Number, default: 0, min: 0 },
  speedTarget:      { type: Number, default: 0, min: 0 },
  throughput:       { type: Number, default: 0, min: 0 },
  utilizationPct:   { type: Number, default: 0, min: 0, max: 100 },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

machineRuntimeSchema.index({ machine: 1, date: -1 });
machineRuntimeSchema.index({ factory: 1, date: -1 });
machineRuntimeSchema.index({ workOrder: 1 });

machineRuntimeSchema.pre('validate', async function (next) {
  if (this.isNew && !this.runtimeNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MachineRuntime').countDocuments();
    this.runtimeNumber = `MRT-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MachineRuntime', machineRuntimeSchema);
