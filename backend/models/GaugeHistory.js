'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const gaugeHistorySchema = new Schema({
  gauge:              { type: Schema.Types.ObjectId, ref: 'Gauge', required: true },
  gaugeNumber:        { type: String, default: '' },
  eventType:          { type: String, enum: ['calibration','maintenance','repair','status_change','assignment','inspection','lost','found','scrapped'], required: true },
  eventDate:          { type: Date, default: Date.now },
  description:        { type: String, default: '' },
  // Calibration-specific
  calibrationResult:  { type: String, enum: ['pass','fail','conditional','na'], default: 'na' },
  calibrationCertNo:  { type: String, default: '' },
  performedBy:        { type: String, default: '' },
  performedByRef:     { type: Schema.Types.ObjectId, ref: 'User' },
  calibrationDate:    { type: Date },
  nextCalibrationDate:{ type: Date },
  standardsUsed:      [{ type: String }],
  readings:           [{ parameter: String, value: Number, spec: String, result: { type: String, enum: ['pass','fail'] } }],
  // Status change
  previousStatus:     { type: String, default: '' },
  newStatus:          { type: String, default: '' },
  // Costs
  cost:               { type: Number, default: 0 },
  vendor:             { type: String, default: '' },
  documentUrl:        { type: String, default: '' },
  notes:              { type: String, default: '' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

gaugeHistorySchema.index({ gauge: 1, eventDate: -1 });
gaugeHistorySchema.index({ gauge: 1, eventType: 1 });
gaugeHistorySchema.index({ calibrationResult: 1 });

module.exports = mongoose.model('GaugeHistory', gaugeHistorySchema);
