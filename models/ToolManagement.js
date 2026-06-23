'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const toolManagementSchema = new Schema({
  toolCode:       { type: String, unique: true },
  name:           { type: String, required: true },
  type:           { type: String, enum: ['cutting','measuring','holding','forming','assembly','testing','welding','other'], default: 'assembly' },
  manufacturer:   { type: String, default: '' },
  model:          { type: String, default: '' },
  serialNumber:   { type: String, default: '' },
  factory:        { type: Schema.Types.ObjectId, ref: 'Factory' },
  workCenter:     { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  status:         { type: String, enum: ['available','in_use','maintenance','calibration','retired'], default: 'available' },
  purchaseDate:   { type: Date },
  purchaseCost:   { type: Number, default: 0, min: 0 },
  lastCalibrationDate: { type: Date },
  nextCalibrationDate: { type: Date },
  calibrationIntervalDays: { type: Number, default: 90 },
  maxUsageCycles: { type: Number, default: 0 },
  currentUsageCycles: { type: Number, default: 0 },
  usageWarningThresholdPct: { type: Number, default: 80, min: 0, max: 100 },
  location:       { type: String, default: '' },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

toolManagementSchema.index({ factory: 1, status: 1 });
toolManagementSchema.index({ type: 1, status: 1 });
toolManagementSchema.index({ nextCalibrationDate: 1 });

toolManagementSchema.pre('validate', async function (next) {
  if (this.isNew && !this.toolCode) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ToolManagement').countDocuments();
    this.toolCode = `TL-${yr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ToolManagement', toolManagementSchema);
