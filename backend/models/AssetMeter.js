'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetMeterSchema = new Schema({
  meterNumber:    { type: String, unique: true },
  asset:          { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:      { type: String, default: '' },
  name:           { type: String, required: true },
  meterType:      { type: String, enum: ['runtime_hours','cycles','production_count','temperature','pressure','vibration','current','voltage','flow','custom'], required: true },
  unit:           { type: String, required: true },
  // Reading management
  currentReading: { type: Number, default: 0 },
  lastReadingDate:{ type: Date },
  lastReadingValue:{ type: Number, default: 0 },
  readingFrequency:{ type: String, enum: ['hourly','daily','weekly','monthly','event_based'], default: 'daily' },
  // Thresholds
  maintenanceThreshold:  { type: Number, default: 0 },
  warningThreshold:      { type: Number, default: 0 },
  criticalThreshold:     { type: Number, default: 0 },
  rolloverValue:         { type: Number },   // when meter resets to 0
  // Status
  isActive:       { type: Boolean, default: true },
  alertEnabled:   { type: Boolean, default: true },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

assetMeterSchema.index({ asset: 1, meterType: 1 });
assetMeterSchema.index({ isActive: 1 });

assetMeterSchema.pre('validate', async function (next) {
  if (this.isNew && !this.meterNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('AssetMeter').countDocuments();
    this.meterNumber = `MTR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AssetMeter', assetMeterSchema);
