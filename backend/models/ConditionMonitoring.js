'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const conditionMonitoringSchema = new Schema({
  monitorNumber:   { type: String, unique: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  sensor:          { type: Schema.Types.ObjectId, ref: 'Sensor' },
  // Parameter being monitored
  parameter:       { type: String, required: true },
  parameterType:   { type: String, enum: ['vibration','temperature','pressure','current','voltage','flow','noise','oil_quality','thickness','alignment','other'], required: true },
  unit:            { type: String, default: '' },
  // Thresholds
  normalMin:       { type: Number },
  normalMax:       { type: Number },
  warningMin:      { type: Number },
  warningMax:      { type: Number },
  criticalMin:     { type: Number },
  criticalMax:     { type: Number },
  // Current state
  currentValue:    { type: Number },
  currentState:    { type: String, enum: ['normal','warning','critical','unknown'], default: 'unknown' },
  lastReadingAt:   { type: Date },
  // Alert
  alertEnabled:    { type: Boolean, default: true },
  alertSent:       { type: Boolean, default: false },
  alertSentAt:     { type: Date },
  // Trend
  trend:           { type: String, enum: ['improving','stable','degrading','critical','unknown'], default: 'unknown' },
  readings:        [{ value: Number, timestamp: { type: Date, default: Date.now }, state: String }],
  isActive:        { type: Boolean, default: true },
  monitoringFrequency: { type: Number, default: 60 },  // minutes
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

conditionMonitoringSchema.index({ asset: 1, parameterType: 1 });
conditionMonitoringSchema.index({ currentState: 1, alertEnabled: 1 });
conditionMonitoringSchema.index({ sensor: 1 });

conditionMonitoringSchema.pre('validate', async function (next) {
  if (this.isNew && !this.monitorNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ConditionMonitoring').countDocuments();
    this.monitorNumber = `CM-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ConditionMonitoring', conditionMonitoringSchema);
