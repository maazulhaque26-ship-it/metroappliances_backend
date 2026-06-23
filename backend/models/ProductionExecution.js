'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionExecutionSchema = new Schema({
  executionNumber: { type: String, unique: true },
  workOrder:       { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  shift:           { type: Schema.Types.ObjectId, ref: 'Shift' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  workCenter:      { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  machine:         { type: Schema.Types.ObjectId, ref: 'Machine' },
  operator:        { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName:    { type: String, default: '' },
  startTime:       { type: Date, required: true },
  endTime:         { type: Date },
  durationMins:    { type: Number, default: 0, min: 0 },
  targetQty:       { type: Number, default: 0, min: 0 },
  actualQty:       { type: Number, default: 0, min: 0 },
  scrapQty:        { type: Number, default: 0, min: 0 },
  reworkQty:       { type: Number, default: 0, min: 0 },
  setupTimeMins:   { type: Number, default: 0, min: 0 },
  status:          { type: String, enum: ['active','paused','completed','cancelled'], default: 'active' },
  pauseReason:     { type: String, default: '' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

productionExecutionSchema.index({ workOrder: 1, startTime: -1 });
productionExecutionSchema.index({ factory: 1, status: 1 });
productionExecutionSchema.index({ machine: 1, startTime: -1 });

productionExecutionSchema.pre('validate', async function (next) {
  if (this.isNew && !this.executionNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ProductionExecution').countDocuments();
    this.executionNumber = `PEX-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductionExecution', productionExecutionSchema);
