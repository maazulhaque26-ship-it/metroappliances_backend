'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const toolCalibrationSchema = new Schema({
  calibrationNumber:   { type: String, unique: true },
  tool:                { type: Schema.Types.ObjectId, ref: 'ToolManagement', required: true },
  calibratedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  calibratedByName:    { type: String, default: '' },
  calibrationDate:     { type: Date, required: true },
  nextCalibrationDate: { type: Date, required: true },
  result:              { type: String, enum: ['pass','fail','conditional'], required: true },
  deviation:           { type: Number, default: 0 },
  deviationUnit:       { type: String, default: '' },
  certificateNumber:   { type: String, default: '' },
  calibrationAgency:   { type: String, default: '' },
  notes:               { type: String, default: '' },
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

toolCalibrationSchema.index({ tool: 1, calibrationDate: -1 });
toolCalibrationSchema.index({ result: 1 });

toolCalibrationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.calibrationNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ToolCalibration').countDocuments();
    this.calibrationNumber = `TCAL-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ToolCalibration', toolCalibrationSchema);
