'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const inspectionCharacteristicSchema = new Schema({
  inspectionPlan:      { type: Schema.Types.ObjectId, ref: 'InspectionPlan', required: true },
  inspectionMethod:    { type: Schema.Types.ObjectId, ref: 'InspectionMethod' },
  characteristicName:  { type: String, required: true },
  characteristicType:  { type: String, enum: ['measurement','attribute','visual','functional'], default: 'measurement' },
  unit:                { type: String, default: '' },
  nominalValue:        { type: Number },
  lowerLimit:          { type: Number },
  upperLimit:          { type: Number },
  lowerWarningLimit:   { type: Number },
  upperWarningLimit:   { type: Number },
  tolerance:           { type: Number },
  samplingFrequency:   { type: String, default: 'every_sample' },
  isRequired:          { type: Boolean, default: true },
  isCritical:          { type: Boolean, default: false },
  sequence:            { type: Number, default: 1, min: 1 },
  instructions:        { type: String, default: '' },
  acceptanceCriteria:  { type: String, default: '' },
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

inspectionCharacteristicSchema.index({ inspectionPlan: 1, sequence: 1 });
inspectionCharacteristicSchema.index({ inspectionPlan: 1, isCritical: 1 });

module.exports = mongoose.model('InspectionCharacteristic', inspectionCharacteristicSchema);
