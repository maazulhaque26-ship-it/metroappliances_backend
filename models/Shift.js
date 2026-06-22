'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const shiftSchema = new Schema({
  code:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:    { type: String, required: true, trim: true },
  factory: { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  startTime:    { type: String, required: true },
  endTime:      { type: String, required: true },
  durationHours:{ type: Number, default: 8 },
  daysOfWeek:   [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
  supervisorName: { type: String, default: '' },
  operatorCount:  { type: Number, default: 0 },
  targetOutput:   { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

shiftSchema.index({ factory: 1, isDeleted: 1 });
shiftSchema.index({ isActive: 1 });

shiftSchema.pre('validate', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('Shift').countDocuments({ factory: this.factory });
    this.code = `SHF-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Shift', shiftSchema);
