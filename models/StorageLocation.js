const mongoose = require('mongoose');

const storageLocationSchema = new mongoose.Schema({
  warehouse:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone', required: true },
  aisle:      { type: String, trim: true, uppercase: true },
  rack:       { type: String, required: true, trim: true, uppercase: true },
  shelf:      { type: String, required: true, trim: true },
  bin:        { type: String, trim: true },
  barcode:    { type: String, trim: true, sparse: true },
  qrCode:     { type: String, trim: true },
  // Capacity — unit count
  capacity:   { type: Number, default: 1, min: 1 },
  occupied:   { type: Number, default: 0, min: 0 },
  // Physical constraints (Sprint 10E)
  volume:         { type: Number, default: 0 },   // cm³
  weightCapacity: { type: Number, default: 0 },   // kg
  temperatureZone:{ type: String, enum: ['ambient', 'cool', 'cold', 'frozen'], default: 'ambient' },
  isHazmat:       { type: Boolean, default: false },
  // Smart putaway hints
  isFastMoving:   { type: Boolean, default: false },
  nearDispatch:   { type: Boolean, default: false },
  nearReceiving:  { type: Boolean, default: false },
  // Grid coordinates for warehouse map
  mapX: { type: Number },
  mapY: { type: Number },
  status:     { type: String, enum: ['available', 'occupied', 'reserved', 'blocked'], default: 'available' },
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

storageLocationSchema.index({ warehouse: 1, isDeleted: 1 });
storageLocationSchema.index({ zone: 1, isDeleted: 1 });
storageLocationSchema.index({ warehouse: 1, aisle: 1, rack: 1, shelf: 1 });
storageLocationSchema.index({ warehouse: 1, rack: 1, shelf: 1 });
storageLocationSchema.index({ status: 1, isDeleted: 1 });
storageLocationSchema.index({ barcode: 1 }, { sparse: true });
storageLocationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StorageLocation', storageLocationSchema);
