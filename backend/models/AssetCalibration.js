'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetCalibrationSchema = new Schema({
  calibrationNumber: { type: String, unique: true },
  asset:             { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:         { type: String, default: '' },
  assetNumber:       { type: String, default: '' },
  calibrationDate:   { type: Date, required: true },
  nextCalibrationDate: { type: Date },
  calibrationInterval: { type: Number, default: 365 },  // days
  calibrationMethod:   { type: String, enum: ['internal','external','on_site','laboratory'], default: 'external' },
  calibratedBy:        { type: String, default: '' },
  externalVendor:      { type: String, default: '' },
  certificateNumber:   { type: String, default: '' },
  overallResult:       { type: String, enum: ['pass','fail','conditional'], required: true },
  readings: [{
    parameter:    String,
    nominalValue: Number,
    measuredValue:Number,
    lowerLimit:   Number,
    upperLimit:   Number,
    unit:         String,
    result:       { type: String, enum: ['pass','fail'] },
  }],
  adjustmentMade:     { type: Boolean, default: false },
  adjustmentDetails:  { type: String, default: '' },
  cost:               { type: Number, default: 0 },
  documentUrl:        { type: String, default: '' },
  calibrationStatus:  { type: String, enum: ['calibrated','due','overdue','not_required'], default: 'calibrated' },
  notes:              { type: String, default: '' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

assetCalibrationSchema.index({ asset: 1, calibrationDate: -1 });
assetCalibrationSchema.index({ nextCalibrationDate: 1 });
assetCalibrationSchema.index({ overallResult: 1 });

assetCalibrationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.calibrationNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('AssetCalibration').countDocuments();
    this.calibrationNumber = `ACL-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetCalibration', assetCalibrationSchema);
