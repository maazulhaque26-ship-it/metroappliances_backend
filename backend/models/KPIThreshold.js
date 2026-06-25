'use strict';
const mongoose = require('mongoose');

const kpiThresholdSchema = new mongoose.Schema({
  kpiName:     { type: String, required: true, trim: true },
  metric:      { type: String, required: true, trim: true },
  unit:        { type: String, default: '%', trim: true },
  warningMin:  { type: Number },
  warningMax:  { type: Number },
  criticalMin: { type: Number },
  criticalMax: { type: Number },
  description: { type: String, trim: true },
  isActive:    { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

kpiThresholdSchema.index({ kpiName: 1, metric: 1 });

module.exports = mongoose.model('KPIThreshold', kpiThresholdSchema);
