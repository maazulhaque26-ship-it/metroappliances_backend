const mongoose = require('mongoose');

const warehouseDeviceSchema = new mongoose.Schema({
  deviceId:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:           { type: String, required: true },
  type:           { type: String, enum: ['barcode_scanner', 'rfid_reader', 'label_printer', 'mobile_computer', 'forklift_terminal', 'sensor_hub', 'camera', 'voice_unit', 'tablet', 'desktop'], required: true },
  serialNumber:   String,
  macAddress:     String,
  ipAddress:      String,
  firmwareVersion:String,
  manufacturer:   String,
  model:          String,
  batteryLevel:   { type: Number, min: 0, max: 100 },
  signalStrength: Number,
  status:         { type: String, enum: ['online', 'offline', 'charging', 'maintenance', 'decommissioned', 'lost'], default: 'offline' },
  warehouseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zoneId:         { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  assignedAt:     Date,
  lastSeen:       Date,
  purchasedAt:    Date,
  warrantyExpiry: Date,
  notes:          String,
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

warehouseDeviceSchema.index({ warehouseId: 1, status: 1 });
warehouseDeviceSchema.index({ type: 1 });
warehouseDeviceSchema.index({ assignedUserId: 1 });
warehouseDeviceSchema.index({ lastSeen: -1 });

module.exports = mongoose.model('WarehouseDevice', warehouseDeviceSchema);
