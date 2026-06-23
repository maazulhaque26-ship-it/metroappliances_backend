'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const inspectionResultSchema = new Schema({
  resultNumber:            { type: String, unique: true },
  inspectionLot:           { type: Schema.Types.ObjectId, ref: 'InspectionLot', required: true },
  inspectionCharacteristic:{ type: Schema.Types.ObjectId, ref: 'InspectionCharacteristic' },
  characteristicName:      { type: String, default: '' },
  sampleNumber:            { type: Number, default: 1, min: 1 },
  measuredValue:           { type: Number },
  textValue:               { type: String, default: '' },
  nominalValue:            { type: Number },
  lowerLimit:              { type: Number },
  upperLimit:              { type: Number },
  unit:                    { type: String, default: '' },
  isWithinTolerance:       { type: Boolean },
  result:                  { type: String, enum: ['pass','fail','conditional','pending'], default: 'pending' },
  gauge:                   { type: Schema.Types.ObjectId, ref: 'Gauge' },
  gaugeName:               { type: String, default: '' },
  recordedBy:              { type: Schema.Types.ObjectId, ref: 'User' },
  recordedByName:          { type: String, default: '' },
  recordedAt:              { type: Date, default: Date.now },
  notes:                   { type: String, default: '' },
  imageUrl:                { type: String, default: '' },
  isDeleted:               { type: Boolean, default: false },
}, { timestamps: true });

inspectionResultSchema.index({ inspectionLot: 1, sampleNumber: 1 });
inspectionResultSchema.index({ inspectionLot: 1, result: 1 });
inspectionResultSchema.index({ inspectionCharacteristic: 1 });

inspectionResultSchema.pre('validate', async function (next) {
  if (this.isNew && !this.resultNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('InspectionResult').countDocuments();
    this.resultNumber = `IR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('InspectionResult', inspectionResultSchema);
