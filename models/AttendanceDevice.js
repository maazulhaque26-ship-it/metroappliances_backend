'use strict';
const mongoose = require('mongoose');

const AttendanceDeviceSchema = new mongoose.Schema({
  deviceCode:    { type: String, unique: true },
  name:          { type: String, required: true, trim: true },
  deviceType:    { type: String, enum: ['biometric', 'rfid', 'qr_code', 'face_recognition', 'mobile', 'manual'], required: true },
  serialNumber:  { type: String, trim: true },
  ipAddress:     { type: String, trim: true },
  location:      { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  locationLabel: { type: String, trim: true },
  isOnline:      { type: Boolean, default: false },
  lastHeartbeat: { type: Date },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
  notes:         { type: String, trim: true },
}, { timestamps: true });

AttendanceDeviceSchema.index({ deviceType: 1, isActive: 1 });
AttendanceDeviceSchema.index({ location: 1 });

AttendanceDeviceSchema.pre('validate', async function (next) {
  if (!this.deviceCode) {
    const count = await mongoose.model('AttendanceDevice').countDocuments();
    this.deviceCode = `DEV-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AttendanceDevice', AttendanceDeviceSchema);
