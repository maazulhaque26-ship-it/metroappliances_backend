const mongoose = require('mongoose');

const SENSOR_TYPES = ['temperature', 'humidity', 'weight', 'door', 'motion', 'power', 'battery', 'co2', 'light', 'vibration'];

const sensorSchema = new mongoose.Schema({
  sensorId:     { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:         { type: String, required: true },
  type:         { type: String, enum: SENSOR_TYPES, required: true },
  warehouseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zoneId:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  locationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  locationDesc: String,
  unit:         String,
  thresholds: {
    min:         Number,
    max:         Number,
    criticalMin: Number,
    criticalMax: Number,
  },
  status:       { type: String, enum: ['active', 'inactive', 'fault', 'calibrating', 'decommissioned'], default: 'active' },
  lastReading: {
    value:      Number,
    timestamp:  Date,
    isAnomaly:  Boolean,
  },
  manufacturer:    String,
  model:           String,
  firmware:        String,
  calibratedAt:    Date,
  calibrationDueAt: Date,
  reportingIntervalSeconds: { type: Number, default: 60 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

sensorSchema.index({ warehouseId: 1, type: 1 });
sensorSchema.index({ zoneId: 1 });
sensorSchema.index({ status: 1 });

module.exports = mongoose.model('Sensor', sensorSchema);
