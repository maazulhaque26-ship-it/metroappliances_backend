'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Standalone maintenance log — distinct from the embedded maintenanceLog subdocs
// in Machine.js which are embedded arrays. This is the EAM-level activity ledger.
const maintenanceLogSchema = new Schema({
  logNumber:       { type: String, unique: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  workOrderNumber: { type: String, default: '' },
  maintenancePlan: { type: Schema.Types.ObjectId, ref: 'MaintenancePlan' },
  logType:         { type: String, enum: ['preventive','corrective','predictive','breakdown','inspection','lubrication','calibration','vendor_service','safety_check','other'], required: true },
  maintenanceDate: { type: Date, required: true },
  description:     { type: String, required: true },
  workPerformed:   { type: String, default: '' },
  partsUsed:       [{ partName: String, partNumber: String, quantity: Number, unitCost: Number }],
  // Time tracking
  startTime:       { type: Date },
  endTime:         { type: Date },
  downtimeHours:   { type: Number, default: 0 },
  laborHours:      { type: Number, default: 0 },
  // Cost
  laborCost:       { type: Number, default: 0 },
  materialCost:    { type: Number, default: 0 },
  totalCost:       { type: Number, default: 0 },
  // Condition
  conditionBefore: { type: String, enum: ['excellent','good','fair','poor','failed'], default: 'fair' },
  conditionAfter:  { type: String, enum: ['excellent','good','fair','poor','failed'], default: 'good' },
  // Personnel
  performedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: '' },
  supervisor:      { type: Schema.Types.ObjectId, ref: 'User' },
  supervisorName:  { type: String, default: '' },
  // Next service
  nextMaintenanceDue: { type: Date },
  nextMaintenanceType:{ type: String, default: '' },
  recommendations: { type: String, default: '' },
  attachments:     [{ name: String, url: String, type: String }],
  result:          { type: String, enum: ['successful','partial','failed','aborted'], default: 'successful' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenanceLogSchema.index({ asset: 1, maintenanceDate: -1 });
maintenanceLogSchema.index({ logType: 1, maintenanceDate: -1 });
maintenanceLogSchema.index({ maintenanceWorkOrder: 1 });
maintenanceLogSchema.index({ maintenanceDate: -1 });

maintenanceLogSchema.pre('validate', async function (next) {
  if (this.isNew && !this.logNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceLog').countDocuments();
    this.logNumber = `ML-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
