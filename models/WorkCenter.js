'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const workCenterSchema = new Schema({
  code:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:    { type: String, required: true, trim: true },
  factory: { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  type:    {
    type: String,
    enum: ['machining', 'assembly', 'quality_check', 'packaging', 'finishing', 'testing', 'other'],
    default: 'assembly',
  },
  capacityPerHour:   { type: Number, default: 0 },
  operatorsRequired: { type: Number, default: 1, min: 1 },
  status:    { type: String, enum: ['active', 'idle', 'maintenance', 'breakdown'], default: 'active' },
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

workCenterSchema.index({ factory: 1, isDeleted: 1 });
workCenterSchema.index({ status: 1 });

workCenterSchema.pre('save', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('WorkCenter').countDocuments({ factory: this.factory });
    this.code = `WC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('WorkCenter', workCenterSchema);
