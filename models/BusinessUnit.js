'use strict';
const mongoose = require('mongoose');

const businessUnitSchema = new mongoose.Schema({
  buCode:      { type: String, unique: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  head:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  country:     { type: String, default: 'India', trim: true },
  currency:    { type: String, default: 'INR', uppercase: true },
  isActive:    { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

businessUnitSchema.pre('validate', async function (next) {
  if (this.buCode) return next();
  const count = await this.constructor.countDocuments();
  this.buCode = `BU-${String(count + 1).padStart(4, '0')}`;
  next();
});

businessUnitSchema.index({ name: 1, isDeleted: 1 });

module.exports = mongoose.model('BusinessUnit', businessUnitSchema);
