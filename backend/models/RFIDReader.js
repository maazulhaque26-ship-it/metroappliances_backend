const mongoose = require('mongoose');

const rfidReaderSchema = new mongoose.Schema({
  readerId:     { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:         { type: String, required: true },
  type:         { type: String, enum: ['handheld', 'fixed_portal', 'tunnel', 'overhead', 'drone_mounted'], default: 'fixed_portal' },
  warehouseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zoneId:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  locationDesc: String,
  status:       { type: String, enum: ['online', 'offline', 'error', 'maintenance', 'decommissioned'], default: 'offline' },
  ipAddress:    String,
  macAddress:   String,
  firmware:     String,
  manufacturer: String,
  model:        String,
  antennas:     { type: Number, default: 1 },
  readRangeMeters: { type: Number, default: 6 },
  lastHeartbeat: Date,
  config: {
    powerLevelDbm:  { type: Number, default: 30 },
    frequencyMhz:   { type: Number, default: 866 },
    sessionMode:    { type: String, default: 'S1' },
    antennaSequence: [Number],
  },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

rfidReaderSchema.index({ warehouseId: 1, status: 1 });
rfidReaderSchema.index({ zoneId: 1 });

module.exports = mongoose.model('RFIDReader', rfidReaderSchema);
