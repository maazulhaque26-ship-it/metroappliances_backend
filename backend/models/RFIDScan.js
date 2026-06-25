const mongoose = require('mongoose');

const rfidScanSchema = new mongoose.Schema({
  epc:          { type: String, required: true, uppercase: true },
  tagId:        { type: mongoose.Schema.Types.ObjectId, ref: 'RFIDTag' },
  readerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'RFIDReader' },
  readerReaderId: String,
  eventType:    { type: String, enum: ['inventory_count', 'entry_gate', 'exit_gate', 'bulk_scan', 'lookup', 'patrol'], default: 'inventory_count' },
  warehouseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  zoneId:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  binId:        { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  rssi:         Number,
  antennaPort:  Number,
  batchId:      String,
  isDuplicate:  { type: Boolean, default: false },
  isUnknown:    { type: Boolean, default: false },
  isMissing:    { type: Boolean, default: false },
  operatorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  scannedAt:    { type: Date, default: Date.now },
}, { _id: true });

rfidScanSchema.index({ scannedAt: 1 }, { expireAfterSeconds: 7_776_000 }); // 90 days TTL
rfidScanSchema.index({ epc: 1, scannedAt: -1 });
rfidScanSchema.index({ warehouseId: 1, scannedAt: -1 });
rfidScanSchema.index({ batchId: 1 });
rfidScanSchema.index({ eventType: 1, scannedAt: -1 });

module.exports = mongoose.model('RFIDScan', rfidScanSchema);
