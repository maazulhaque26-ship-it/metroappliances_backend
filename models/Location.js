'use strict';
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  locationCode: { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  locationType: { type: String, enum: ['head_office','branch','factory','warehouse','site','remote'], default: 'branch' },
  address:      { type: String, default: '' },
  city:         { type: String, default: '', trim: true },
  state:        { type: String, default: '', trim: true },
  country:      { type: String, default: 'India', trim: true },
  pincode:      { type: String, default: '', trim: true },
  phone:        { type: String, default: '', trim: true },
  manager:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  headCount:    { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

locationSchema.pre('validate', async function (next) {
  if (this.locationCode) return next();
  const count = await this.constructor.countDocuments();
  this.locationCode = `LOC-${String(count + 1).padStart(4, '0')}`;
  next();
});

locationSchema.index({ name: 1, isDeleted: 1 });
locationSchema.index({ city: 1 });

module.exports = mongoose.model('Location', locationSchema);
