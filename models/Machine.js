'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceLogSchema = new Schema({
  type:        { type: String, enum: ['scheduled', 'breakdown', 'preventive'], default: 'scheduled' },
  description: { type: String, default: '' },
  performedBy: { type: String, default: '' },
  performedAt: { type: Date, default: Date.now },
  cost:        { type: Number, default: 0 },
  downtimeHours: { type: Number, default: 0 },
}, { _id: true, timestamps: false });

const machineSchema = new Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  type:         { type: String, required: true, trim: true },
  workCenter:   { type: Schema.Types.ObjectId, ref: 'WorkCenter', required: true },
  factory:      { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  manufacturer: { type: String, default: '' },
  model:        { type: String, default: '' },
  serialNumber: { type: String, default: '' },
  purchaseDate:         { type: Date },
  lastMaintenanceDate:  { type: Date },
  nextMaintenanceDate:  { type: Date },
  status:       { type: String, enum: ['running', 'idle', 'maintenance', 'breakdown', 'decommissioned'], default: 'idle' },
  utilizationRate: { type: Number, default: 0, min: 0, max: 100 },
  oee:             { type: Number, default: 0, min: 0, max: 100 },
  maintenanceLogs: [maintenanceLogSchema],
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

machineSchema.index({ workCenter: 1, isDeleted: 1 });
machineSchema.index({ factory: 1, isDeleted: 1 });
machineSchema.index({ status: 1 });

machineSchema.pre('save', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('Machine').countDocuments({ factory: this.factory });
    this.code = `MCH-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Machine', machineSchema);
