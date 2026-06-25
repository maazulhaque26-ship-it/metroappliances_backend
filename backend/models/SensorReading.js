const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  sensorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor', required: true },
  warehouseId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  value:      { type: Number, required: true },
  unit:       String,
  timestamp:  { type: Date, default: Date.now },
  isAnomaly:  { type: Boolean, default: false },
  severity:   { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
  alertSent:  { type: Boolean, default: false },
}, { _id: true });

sensorReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2_592_000 }); // 30 days TTL
sensorReadingSchema.index({ sensorId: 1, timestamp: -1 });
sensorReadingSchema.index({ warehouseId: 1, timestamp: -1 });
sensorReadingSchema.index({ isAnomaly: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
