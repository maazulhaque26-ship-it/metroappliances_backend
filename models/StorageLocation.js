const mongoose = require('mongoose');

const storageLocationSchema = new mongoose.Schema({
  warehouse:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone', required: true },
  rack:       { type: String, required: true, trim: true, uppercase: true },
  shelf:      { type: String, required: true, trim: true },
  bin:        { type: String, trim: true },
  barcode:    { type: String, trim: true, sparse: true },
  qrCode:     { type: String, trim: true },
  capacity:   { type: Number, default: 1, min: 1 },
  occupied:   { type: Number, default: 0, min: 0 },
  status:     { type: String, enum: ['available', 'occupied', 'reserved', 'blocked'], default: 'available' },
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

storageLocationSchema.index({ warehouse: 1, isDeleted: 1 });
storageLocationSchema.index({ zone: 1, isDeleted: 1 });
storageLocationSchema.index({ warehouse: 1, rack: 1, shelf: 1 });
storageLocationSchema.index({ status: 1, isDeleted: 1 });
storageLocationSchema.index({ barcode: 1 }, { sparse: true });
storageLocationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StorageLocation', storageLocationSchema);
