const mongoose = require('mongoose');

const ZONE_TYPES = ['receiving', 'storage', 'picking', 'packing', 'returns', 'damaged', 'dispatch', 'custom'];

const warehouseZoneSchema = new mongoose.Schema({
  warehouse:    { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  code:         { type: String, required: true, trim: true, uppercase: true },
  name:         { type: String, required: true, trim: true },
  type:         { type: String, enum: ZONE_TYPES, required: true },
  description:  { type: String, trim: true },
  capacity:     { type: Number, default: 0 },
  usedCapacity: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

warehouseZoneSchema.index({ warehouse: 1, isDeleted: 1 });
warehouseZoneSchema.index({ warehouse: 1, type: 1, isDeleted: 1 });
warehouseZoneSchema.index({ warehouse: 1, code: 1 }, { unique: true });
warehouseZoneSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WarehouseZone', warehouseZoneSchema);
