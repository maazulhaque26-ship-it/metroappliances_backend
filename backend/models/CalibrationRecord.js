'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const calibrationRecordSchema = new Schema({
  recordNumber:     { type: String, unique: true },
  gauge:            { type: Schema.Types.ObjectId, ref: 'Gauge', required: true },
  gaugeName:        { type: String, default: '' },
  gaugeNumber:      { type: String, default: '' },
  calibrationSchedule: { type: Schema.Types.ObjectId, ref: 'CalibrationSchedule' },
  calibrationDate:  { type: Date, required: true },
  nextCalibrationDate: { type: Date },
  calibrationMethod:{ type: String, enum: ['internal','external','on_site','laboratory'], default: 'internal' },
  calibratedBy:     { type: String, default: '' },
  calibratedByRef:  { type: Schema.Types.ObjectId, ref: 'User' },
  externalVendor:   { type: String, default: '' },
  certificateNumber:{ type: String, default: '' },
  traceable:        { type: Boolean, default: true },
  traceabilityStandard: { type: String, default: '' },
  referenceStandards: [{ name: String, serial: String, certNumber: String, dueDate: Date }],
  environmentConditions: {
    temperature: { type: Number },
    humidity:    { type: Number },
    pressure:    { type: Number },
  },
  readings: [{
    parameter:    String,
    nominalValue: Number,
    measuredValue:Number,
    lowerLimit:   Number,
    upperLimit:   Number,
    unit:         String,
    uncertainty:  Number,
    result:       { type: String, enum: ['pass','fail'] },
  }],
  overallResult:    { type: String, enum: ['pass','fail','conditional'], required: true },
  adjustmentMade:   { type: Boolean, default: false },
  adjustmentDetails:{ type: String, default: '' },
  cost:             { type: Number, default: 0 },
  documentUrl:      { type: String, default: '' },
  approvedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:   { type: String, default: '' },
  approvedAt:       { type: Date },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

calibrationRecordSchema.index({ gauge: 1, calibrationDate: -1 });
calibrationRecordSchema.index({ overallResult: 1, calibrationDate: -1 });
calibrationRecordSchema.index({ nextCalibrationDate: 1 });

calibrationRecordSchema.pre('validate', async function (next) {
  if (this.isNew && !this.recordNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('CalibrationRecord').countDocuments();
    this.recordNumber = `CR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CalibrationRecord', calibrationRecordSchema);
