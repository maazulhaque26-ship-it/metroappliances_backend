'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const meterReadingSchema = new Schema({
  assetMeter:    { type: Schema.Types.ObjectId, ref: 'AssetMeter', required: true },
  asset:         { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  readingValue:  { type: Number, required: true },
  previousReading: { type: Number, default: 0 },
  difference:    { type: Number, default: 0 },
  readingDate:   { type: Date, required: true },
  readingType:   { type: String, enum: ['manual','automatic','estimated'], default: 'manual' },
  unit:          { type: String, default: '' },
  isThresholdBreached:    { type: Boolean, default: false },
  isMaintenanceTriggered: { type: Boolean, default: false },
  maintenanceWorkOrder:   { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  recordedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  recordedByName:{ type: String, default: '' },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

meterReadingSchema.index({ assetMeter: 1, readingDate: -1 });
meterReadingSchema.index({ asset: 1, readingDate: -1 });
meterReadingSchema.index({ isThresholdBreached: 1 });

module.exports = mongoose.model('MeterReading', meterReadingSchema);
