const mongoose = require('mongoose');

const warehouseSettingsSchema = new mongoose.Schema({
  warehouse:            { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, unique: true },
  defaultReceivingZone: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  defaultDispatchZone:  { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  autoBinAllocation:    { type: Boolean, default: false },
  barcodePrefix:        { type: String, trim: true, uppercase: true, default: 'WH' },
  qrPrefix:             { type: String, trim: true, uppercase: true, default: 'QR' },
  workingHoursStart:    { type: String, default: '09:00' },
  workingHoursEnd:      { type: String, default: '18:00' },
  workingDays:          { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  capacityWarningPct:   { type: Number, default: 80, min: 10, max: 100 },
  lowStockThreshold:    { type: Number, default: 10 },
  autoGRNApproval:      { type: Boolean, default: false },
}, { timestamps: true });

warehouseSettingsSchema.index({ warehouse: 1 });

module.exports = mongoose.model('WarehouseSettings', warehouseSettingsSchema);
