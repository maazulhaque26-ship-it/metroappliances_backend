'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const capacityPlanSchema = new Schema({
  factory:           { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  workCenter:        { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  machine:           { type: Schema.Types.ObjectId, ref: 'Machine' },
  periodStart:       { type: Date, required: true },
  periodEnd:         { type: Date, required: true },
  planType:          { type: String, enum: ['weekly','monthly','quarterly'], default: 'weekly' },
  // Capacity in machine-hours
  totalCapacity:     { type: Number, default: 0, min: 0 },
  availableCapacity: { type: Number, default: 0, min: 0 },
  allocatedCapacity: { type: Number, default: 0, min: 0 },
  utilizationPct:    { type: Number, default: 0, min: 0, max: 100 },
  // Bottleneck flag
  isBottleneck:      { type: Boolean, default: false },
  bottleneckReason:  { type: String, default: '' },
  // Operator capacity
  operatorCount:     { type: Number, default: 0, min: 0 },
  operatorHours:     { type: Number, default: 0, min: 0 },
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

capacityPlanSchema.index({ factory: 1, periodStart: 1 });
capacityPlanSchema.index({ workCenter: 1, periodStart: 1 });
capacityPlanSchema.index({ machine: 1, periodStart: 1 });
capacityPlanSchema.index({ isBottleneck: 1 });

module.exports = mongoose.model('CapacityPlan', capacityPlanSchema);
