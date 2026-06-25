'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const predictiveMaintenanceSchema = new Schema({
  predNumber:      { type: String, unique: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  // Condition data
  healthScore:     { type: Number, default: 100, min: 0, max: 100 },
  riskScore:       { type: Number, default: 0, min: 0, max: 100 },
  failureProbability: { type: Number, default: 0, min: 0, max: 100 },
  remainingUsefulLife: { type: Number, default: 0 },  // hours
  rulUnit:         { type: String, enum: ['hours','days','cycles'], default: 'hours' },
  // Prediction
  predictedFailureDate: { type: Date },
  confidenceLevel: { type: Number, default: 0, min: 0, max: 100 },
  failureMode:     { type: String, default: '' },
  // Sensor readings that triggered
  triggeringSensor:{ type: Schema.Types.ObjectId, ref: 'Sensor' },
  triggeringReading: { type: Number },
  triggeringParameter: { type: String, default: '' },
  // Trend
  trend:           { type: String, enum: ['improving','stable','degrading','critical','unknown'], default: 'stable' },
  trendDescription:{ type: String, default: '' },
  // Recommendation
  recommendedAction: { type: String, enum: ['monitor','plan_maintenance','schedule_urgent','immediate_action','replace'], default: 'monitor' },
  recommendedDate: { type: Date },
  // Status
  status:          { type: String, enum: ['active','actioned','dismissed','closed'], default: 'active' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  actionedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  actionedByName:  { type: String, default: '' },
  actionedAt:      { type: Date },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

predictiveMaintenanceSchema.index({ asset: 1, status: 1 });
predictiveMaintenanceSchema.index({ healthScore: 1, status: 1 });
predictiveMaintenanceSchema.index({ predictedFailureDate: 1, status: 1 });
predictiveMaintenanceSchema.index({ failureProbability: -1, status: 1 });

predictiveMaintenanceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.predNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('PredictiveMaintenance').countDocuments();
    this.predNumber = `PRED-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PredictiveMaintenance', predictiveMaintenanceSchema);
