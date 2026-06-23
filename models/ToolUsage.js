'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const toolUsageSchema = new Schema({
  usageNumber:   { type: String, unique: true },
  tool:          { type: Schema.Types.ObjectId, ref: 'ToolManagement', required: true },
  workOrder:     { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  workOrderOperation: { type: Schema.Types.ObjectId, ref: 'WorkOrderOperation' },
  operator:      { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName:  { type: String, default: '' },
  machine:       { type: Schema.Types.ObjectId, ref: 'Machine' },
  startTime:     { type: Date, required: true },
  endTime:       { type: Date },
  durationMins:  { type: Number, default: 0, min: 0 },
  cyclesUsed:    { type: Number, default: 0, min: 0 },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

toolUsageSchema.index({ tool: 1, startTime: -1 });
toolUsageSchema.index({ workOrder: 1 });

toolUsageSchema.pre('validate', async function (next) {
  if (this.isNew && !this.usageNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ToolUsage').countDocuments();
    this.usageNumber = `TU-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ToolUsage', toolUsageSchema);
