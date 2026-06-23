const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
  name:          { type: String, required: true, trim: true, maxlength: 100 },
  address:       { type: String, required: true, trim: true },
  city:          { type: String, required: true, trim: true },
  state:         { type: String, required: true, trim: true },
  country:       { type: String, default: 'India', trim: true },
  pincode:       { type: String, trim: true },
  gst:           { type: String, trim: true, uppercase: true },
  phone:         { type: String, trim: true },
  email:         { type: String, trim: true, lowercase: true },
  manager:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  totalCapacity: { type: Number, default: 0 },
  usedCapacity:  { type: Number, default: 0 },
  status:        { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  timezone:      { type: String, default: 'Asia/Kolkata' },
  notes:         { type: String, trim: true, maxlength: 500 },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

warehouseSchema.index({ status: 1, isDeleted: 1 });
warehouseSchema.index({ city: 1, isDeleted: 1 });
warehouseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
