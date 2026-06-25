const mongoose = require('mongoose');

const voiceLogSchema = new mongoose.Schema({
  timestamp:  { type: Date, default: Date.now },
  direction:  { type: String, enum: ['system', 'operator'] },
  text:       String,
  action:     String,
  itemIndex:  Number,
}, { _id: false });

const voiceItemSchema = new mongoose.Schema({
  productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku:          String,
  productName:  String,
  binCode:      String,
  requiredQty:  Number,
  pickedQty:    { type: Number, default: 0 },
  status:       { type: String, enum: ['pending', 'confirmed', 'skipped', 'partial'], default: 'pending' },
  pickedAt:     Date,
}, { _id: false });

const voicePickingSessionSchema = new mongoose.Schema({
  pickingListId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
  warehouseUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser', required: true },
  warehouseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  status:          { type: String, enum: ['active', 'paused', 'completed', 'abandoned'], default: 'active' },
  currentItemIndex:{ type: Number, default: 0 },
  items:           [voiceItemSchema],
  voiceLogs:       [voiceLogSchema],
  totalItems:      Number,
  confirmedItems:  { type: Number, default: 0 },
  skippedItems:    { type: Number, default: 0 },
  accuracy:        Number,
  startedAt:       { type: Date, default: Date.now },
  pausedAt:        Date,
  completedAt:     Date,
  totalDurationMs: Number,
}, { timestamps: true });

voicePickingSessionSchema.index({ warehouseUserId: 1, status: 1 });
voicePickingSessionSchema.index({ pickingListId: 1 });
voicePickingSessionSchema.index({ warehouseId: 1, createdAt: -1 });

module.exports = mongoose.model('VoicePickingSession', voicePickingSessionSchema);
