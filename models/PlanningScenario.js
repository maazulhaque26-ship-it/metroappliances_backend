'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const planningScenarioSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  basePlan:    { type: Schema.Types.ObjectId, ref: 'ProductionPlan' },
  factory:     { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  status:      { type: String, enum: ['draft','active','archived'], default: 'draft' },
  assumptions: { type: String, default: '' },
  // Scenario parameters
  targetOutput:      { type: Number, default: 0, min: 0 },
  efficiencyFactor:  { type: Number, default: 100, min: 0, max: 200 },
  extraShifts:       { type: Number, default: 0, min: 0 },
  maintenanceBuffer: { type: Number, default: 5, min: 0, max: 100 },
  materialAvailability: { type: Number, default: 100, min: 0, max: 100 },
  // Computed projections
  projectedCapacity:    { type: Number, default: 0 },
  projectedCompletion:  { type: Date },
  projectedUtilization: { type: Number, default: 0 },
  lateOrderRisk:        { type: String, enum: ['low','medium','high'], default: 'low' },
  notes:     { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

planningScenarioSchema.index({ factory: 1, status: 1 });
planningScenarioSchema.index({ basePlan: 1 });
planningScenarioSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('PlanningScenario', planningScenarioSchema);
