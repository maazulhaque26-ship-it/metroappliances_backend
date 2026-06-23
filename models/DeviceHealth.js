const mongoose = require('mongoose');

const deviceHealthSchema = new mongoose.Schema({
  deviceId:         { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseDevice', required: true },
  warehouseDeviceId:String,
  timestamp:        { type: Date, default: Date.now },
  batteryLevel:     { type: Number, min: 0, max: 100 },
  signalStrength:   Number,
  memoryUsageMB:    Number,
  cpuPercent:       Number,
  temperatureCelsius: Number,
  errorCode:        String,
  errorMessage:     String,
  isOnline:         { type: Boolean, default: true },
  responseTimeMs:   Number,
}, { _id: true });

deviceHealthSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604_800 }); // 7 days TTL
deviceHealthSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('DeviceHealth', deviceHealthSchema);
