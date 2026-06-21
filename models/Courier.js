const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  code:           { type: String, required: true, uppercase: true, trim: true, unique: true },
  contactEmail:   { type: String, trim: true },
  contactPhone:   { type: String, trim: true },
  website:        { type: String, trim: true },
  trackingUrl:    { type: String, trim: true }, // {trackingNumber} placeholder
  serviceLevels:  [{ type: String }], // standard, express, overnight
  supportedZones: [{ type: String }],
  avgDeliveryDays: { type: Number, default: 3 },
  status:         { type: String, enum: ['active','inactive'], default: 'active' },
  notes:          { type: String },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

courierSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('Courier', courierSchema);
