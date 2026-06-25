'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const gaugeSchema = new Schema({
  gaugeNumber:        { type: String, unique: true },
  name:               { type: String, required: true },
  description:        { type: String, default: '' },
  gaugeType:          { type: String, enum: ['caliper','micrometer','gauge_block','cmm','dial_indicator','thread_gauge','go_nogo','hardness_tester','surface_roughness','torque_wrench','pressure_gauge','temperature_sensor','other'], required: true },
  manufacturer:       { type: String, default: '' },
  model:              { type: String, default: '' },
  serialNumber:       { type: String, default: '' },
  assetTag:           { type: String, default: '' },
  location:           { type: String, default: '' },
  factory:            { type: Schema.Types.ObjectId, ref: 'Factory' },
  department:         { type: String, default: '' },
  // Measurement specs
  measurementRange:   { lower: { type: Number }, upper: { type: Number } },
  resolution:         { type: Number },
  accuracy:           { type: Number },
  unit:               { type: String, default: 'mm' },
  // Calibration tracking
  status:             { type: String, enum: ['in_service','out_of_service','under_calibration','lost','scrapped','standby'], default: 'in_service' },
  calibrationStatus:  { type: String, enum: ['calibrated','due','overdue','not_required'], default: 'calibrated' },
  calibrationInterval:{ type: Number, default: 365 }, // days
  lastCalibrationDate:{ type: Date },
  nextCalibrationDate:{ type: Date },
  calibrationCost:    { type: Number, default: 0 },
  externalCalibration:{ type: Boolean, default: false },
  calibrationVendor:  { type: String, default: '' },
  // MSA data
  repeatability:      { type: Number },
  reproducibility:    { type: Number },
  gageRnR:            { type: Number },
  purchaseDate:       { type: Date },
  purchaseCost:       { type: Number, default: 0 },
  assignedTo:         { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:     { type: String, default: '' },
  notes:              { type: String, default: '' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

gaugeSchema.index({ status: 1, calibrationStatus: 1 });
gaugeSchema.index({ nextCalibrationDate: 1, calibrationStatus: 1 });
gaugeSchema.index({ factory: 1, gaugeType: 1 });
gaugeSchema.index({ gaugeType: 1 });

gaugeSchema.pre('validate', async function (next) {
  if (this.isNew && !this.gaugeNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('Gauge').countDocuments();
    this.gaugeNumber = `GG-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Gauge', gaugeSchema);
