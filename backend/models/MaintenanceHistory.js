'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceHistorySchema = new Schema({
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetNumber:     { type: String, default: '' },
  assetName:       { type: String, default: '' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  workOrderNumber: { type: String, default: '' },
  maintenanceType: { type: String, enum: ['preventive','corrective','predictive','emergency','inspection','overhaul'], required: true },
  performedDate:   { type: Date, required: true },
  performedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: '' },
  duration:        { type: Number, default: 0 },  // minutes
  downtime:        { type: Number, default: 0 },  // hours
  cost:            { type: Number, default: 0 },
  description:     { type: String, default: '' },
  workDone:        { type: String, default: '' },
  findings:        { type: String, default: '' },
  partsReplaced:   [{ partName: String, partNumber: String, quantity: Number, cost: Number }],
  nextMaintenanceDate: { type: Date },
  conditionBefore: { type: String, enum: ['excellent','good','fair','poor','critical','unknown'], default: 'unknown' },
  conditionAfter:  { type: String, enum: ['excellent','good','fair','poor','critical','unknown'], default: 'unknown' },
  result:          { type: String, enum: ['successful','partially_successful','failed','deferred'], default: 'successful' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenanceHistorySchema.index({ asset: 1, performedDate: -1 });
maintenanceHistorySchema.index({ maintenanceType: 1, performedDate: -1 });
maintenanceHistorySchema.index({ performedDate: -1 });

module.exports = mongoose.model('MaintenanceHistory', maintenanceHistorySchema);
