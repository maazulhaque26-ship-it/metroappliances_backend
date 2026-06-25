const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  readerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'RFIDReader' },
  binId:     { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  eventType: { type: String, enum: ['read','entry','exit','inventory','assignment','replacement'], default: 'read' },
  rssi:      Number,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const rfidTagSchema = new mongoose.Schema({
  epc:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  tid:          { type: String, trim: true },
  format:       { type: String, enum: ['EPC96', 'SGTIN-96', 'SSCC-96', 'GIAI-96', 'CUSTOM'], default: 'EPC96' },
  entityType:   { type: String, enum: ['product', 'pallet', 'carton', 'bin', 'asset', 'vehicle'], required: true },
  entityId:     { type: mongoose.Schema.Types.ObjectId },
  label:        String,
  warehouseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  currentBinId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  lastReaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFIDReader' },
  status:       { type: String, enum: ['active', 'inactive', 'lost', 'damaged', 'replaced'], default: 'active' },
  assignedAt:   Date,
  lastSeenAt:   Date,
  replacedByEpc: String,
  history:      [historySchema],
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

rfidTagSchema.index({ entityType: 1, entityId: 1 });
rfidTagSchema.index({ warehouseId: 1, status: 1 });
rfidTagSchema.index({ currentBinId: 1 });
rfidTagSchema.index({ lastSeenAt: -1 });

module.exports = mongoose.model('RFIDTag', rfidTagSchema);
