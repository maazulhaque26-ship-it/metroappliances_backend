const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId   = Schema.Types.ObjectId;

const SCAN_TYPES   = ['barcode', 'qr', 'manual'];
const SCAN_ACTIONS = [
  'receive', 'putaway', 'pick', 'pack', 'dispatch',
  'transfer', 'cycle_count', 'return', 'lookup', 'validate',
];
const SCAN_RESULTS = ['success', 'not_found', 'wrong_bin', 'wrong_sku', 'duplicate',
                      'expired_batch', 'wrong_batch', 'wrong_serial', 'over_pick',
                      'short_pick', 'invalid_format', 'error'];

const scanLogSchema = new Schema({
  // Who scanned
  warehouseUser:  { type: ObjectId, ref: 'WarehouseUser' },
  adminUser:      { type: ObjectId, ref: 'User' },
  warehouse:      { type: ObjectId, ref: 'Warehouse' },

  // What was scanned
  rawValue:    { type: String, required: true, trim: true, maxlength: 500 },
  scanType:    { type: String, enum: SCAN_TYPES, default: 'barcode' },
  action:      { type: String, enum: SCAN_ACTIONS, required: true },

  // Resolved entity (populated after lookup)
  resolvedEntityType: { type: String },
  resolvedEntityId:   { type: ObjectId },
  resolvedLabel:      { type: String, maxlength: 200 },

  // Context (e.g., which picking list, which GRN, etc.)
  contextType: { type: String },
  contextId:   { type: ObjectId },

  // Result
  result:      { type: String, enum: SCAN_RESULTS, required: true },
  errorMessage:{ type: String, maxlength: 300 },

  // Device info
  deviceType:  { type: String, enum: ['usb', 'bluetooth', 'camera', 'manual', 'api'], default: 'manual' },
  sessionId:   { type: String, maxlength: 100 },   // groups scans from the same operator session

  // Duration (ms) from scan initiation to result
  durationMs:  { type: Number, default: 0 },

  scannedAt:   { type: Date, default: Date.now },
}, { timestamps: false });

scanLogSchema.index({ warehouseUser: 1, scannedAt: -1 });
scanLogSchema.index({ warehouse: 1, scannedAt: -1 });
scanLogSchema.index({ action: 1, result: 1, scannedAt: -1 });
scanLogSchema.index({ result: 1, scannedAt: -1 });
scanLogSchema.index({ rawValue: 1, scannedAt: -1 });
scanLogSchema.index({ scannedAt: -1 });
// TTL: keep scan logs for 1 year
scanLogSchema.index({ scannedAt: 1 }, { expireAfterSeconds: 31_536_000 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
