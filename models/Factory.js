'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const factorySchema = new Schema({
  code:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:    { type: String, required: true, trim: true },
  type:    { type: String, enum: ['main', 'assembly', 'packaging', 'warehouse', 'mixed'], default: 'main' },
  address: {
    street:  { type: String, default: '' },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  contactPerson: { type: String, default: '' },
  contactPhone:  { type: String, default: '' },
  contactEmail:  { type: String, default: '' },
  totalArea:     { type: Number, default: 0 },
  productionCapacityPerDay: { type: Number, default: 0 },
  operatingHours: {
    start: { type: String, default: '08:00' },
    end:   { type: String, default: '20:00' },
  },
  status:    { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

factorySchema.index({ status: 1, isDeleted: 1 });
factorySchema.index({ createdAt: -1 });

factorySchema.pre('validate', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('Factory').countDocuments();
    this.code = `FAC-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Factory', factorySchema);
