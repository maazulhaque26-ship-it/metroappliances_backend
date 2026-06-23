'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const oeeRecordSchema = new Schema({
  oeeNumber:        { type: String, unique: true },
  machine:          { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
  workOrder:        { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  shift:            { type: Schema.Types.ObjectId, ref: 'Shift' },
  factory:          { type: Schema.Types.ObjectId, ref: 'Factory' },
  date:             { type: Date, required: true },
  // Time components (all in minutes)
  plannedProductionTimeMins: { type: Number, default: 0, min: 0 },
  unplannedDowntimeMins:     { type: Number, default: 0, min: 0 },
  plannedDowntimeMins:       { type: Number, default: 0, min: 0 },
  actualProductionTimeMins:  { type: Number, default: 0, min: 0 },
  setupTimeMins:             { type: Number, default: 0, min: 0 },
  // Cycle & parts
  idealCycleTimeSecs: { type: Number, default: 0, min: 0 },
  actualCycleTimeSecs:{ type: Number, default: 0, min: 0 },
  totalParts:         { type: Number, default: 0, min: 0 },
  goodParts:          { type: Number, default: 0, min: 0 },
  defectiveParts:     { type: Number, default: 0, min: 0 },
  // OEE components (all 0–100 %)
  availability:  { type: Number, default: 0, min: 0, max: 100 },
  performance:   { type: Number, default: 0, min: 0, max: 100 },
  quality:       { type: Number, default: 0, min: 0, max: 100 },
  oee:           { type: Number, default: 0, min: 0, max: 100 },
  // Reliability
  mtbf: { type: Number, default: 0, min: 0 },
  mttr: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

oeeRecordSchema.index({ machine: 1, date: -1 });
oeeRecordSchema.index({ factory: 1, date: -1 });
oeeRecordSchema.index({ date: -1, oee: -1 });

oeeRecordSchema.pre('validate', async function (next) {
  if (this.isNew && !this.oeeNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('OEERecord').countDocuments();
    this.oeeNumber = `OEE-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('OEERecord', oeeRecordSchema);
