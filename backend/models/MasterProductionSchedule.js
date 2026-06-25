'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const mpsItemSchema = new Schema({
  productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  productName:     { type: String, default: '' },
  plannedQty:      { type: Number, default: 0, min: 0 },
  scheduledStart:  { type: Date },
  scheduledEnd:    { type: Date },
  workCenter:      { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  machine:         { type: Schema.Types.ObjectId, ref: 'Machine' },
  shift:           { type: Schema.Types.ObjectId, ref: 'Shift' },
  priority:        { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  status:          { type: String, enum: ['planned','confirmed','in_progress','completed','delayed'], default: 'planned' },
  durationHours:   { type: Number, default: 0, min: 0 },
}, { _id: true });

const mpsSchema = new Schema({
  mpsNumber:    { type: String, unique: true },
  plan:         { type: Schema.Types.ObjectId, ref: 'ProductionPlan', required: true },
  factory:      { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  weekNumber:   { type: Number, min: 1, max: 53 },
  monthNumber:  { type: Number, min: 1, max: 12 },
  year:         { type: Number, required: true },
  periodStart:  { type: Date, required: true },
  periodEnd:    { type: Date, required: true },
  scheduledItems:   [mpsItemSchema],
  totalCapacity:    { type: Number, default: 0, min: 0 },
  usedCapacity:     { type: Number, default: 0, min: 0 },
  utilizationPct:   { type: Number, default: 0, min: 0, max: 100 },
  status:      { type: String, enum: ['draft','locked','archived'], default: 'draft' },
  notes:       { type: String, default: '' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

mpsSchema.index({ plan: 1, isDeleted: 1 });
mpsSchema.index({ factory: 1, periodStart: 1 });
mpsSchema.index({ year: 1, weekNumber: 1 });

mpsSchema.pre('validate', async function (next) {
  if (this.isNew && !this.mpsNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MasterProductionSchedule').countDocuments();
    this.mpsNumber = `MPS-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MasterProductionSchedule', mpsSchema);
