'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const breakdownRecordSchema = new Schema({
  breakdownNumber: { type: String, unique: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  assetNumber:     { type: String, default: '' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  breakdownDate:   { type: Date, required: true },
  restoredDate:    { type: Date },
  // Breakdown details
  failureMode:     { type: String, enum: ['mechanical','electrical','hydraulic','pneumatic','software','operator_error','wear','corrosion','contamination','other'], required: true },
  failureDescription: { type: String, default: '' },
  rootCause:          { type: String, default: '' },
  rootCauseCategory:  { type: String, enum: ['design','manufacturing','operation','maintenance','environmental','supplier','unknown'], default: 'unknown' },
  // Impact
  severity:        { type: String, enum: ['minor','moderate','major','critical'], required: true },
  productionImpact:{ type: String, enum: ['none','partial','full_stop'], default: 'none' },
  downtimeHours:   { type: Number, default: 0 },
  lostProduction:  { type: Number, default: 0 },
  failureCost:     { type: Number, default: 0 },
  repairCost:      { type: Number, default: 0 },
  // Resolution
  correctiveAction:{ type: String, default: '' },
  partsReplaced:   [{ partName: String, partNumber: String, quantity: Number, cost: Number }],
  repairedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  repairedByName:  { type: String, default: '' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  // Metrics
  mttrHours:       { type: Number, default: 0 },  // mean time to repair
  // Status
  status:          { type: String, enum: ['open','in_progress','resolved','verified','closed'], default: 'open' },
  reportedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  reportedByName:  { type: String, default: '' },
  // Prevention
  preventionMeasures: { type: String, default: '' },
  capaRequired:    { type: Boolean, default: false },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

breakdownRecordSchema.index({ asset: 1, breakdownDate: -1 });
breakdownRecordSchema.index({ status: 1, severity: -1 });
breakdownRecordSchema.index({ factory: 1, breakdownDate: -1 });
breakdownRecordSchema.index({ failureMode: 1 });

breakdownRecordSchema.pre('validate', async function (next) {
  if (this.isNew && !this.breakdownNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('BreakdownRecord').countDocuments();
    this.breakdownNumber = `BRK-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BreakdownRecord', breakdownRecordSchema);
