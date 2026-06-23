const mongoose = require('mongoose');

const ALERT_TYPES = [
  'temp_high', 'temp_low', 'humidity_high', 'humidity_low',
  'battery_low', 'device_offline', 'rfid_conflict', 'rfid_unknown',
  'rfid_missing', 'bin_overflow', 'low_stock', 'stock_mismatch',
  'sensor_fault', 'door_open', 'motion_detected', 'power_failure', 'manual',
];

const alertSchema = new mongoose.Schema({
  type:        { type: String, enum: ALERT_TYPES, required: true },
  severity:    { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' },
  title:       { type: String, required: true },
  message:     { type: String, required: true },
  details:     mongoose.Schema.Types.Mixed,
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  entityType:  String,
  entityId:    mongoose.Schema.Types.ObjectId,
  status:      { type: String, enum: ['active', 'acknowledged', 'resolved', 'dismissed'], default: 'active' },
  acknowledgedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt:  Date,
  resolvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:      Date,
  autoResolvable:  { type: Boolean, default: false },
  autoResolvedAt:  Date,
  notificationSent:{ type: Boolean, default: false },
}, { timestamps: true });

alertSchema.index({ warehouseId: 1, status: 1, createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Alert', alertSchema);
