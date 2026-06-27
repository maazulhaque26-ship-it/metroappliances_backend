'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Available capacity for an employee in a given period (cross-project planning).
const resourceCapacitySchema = new Schema({
  employee:       { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  portfolio:      { type: Schema.Types.ObjectId, ref: 'Portfolio' },
  period:         { type: String, required: true },
  periodType:     { type: String, enum: ['week','month','quarter'], default: 'month' },
  availableHours: { type: Number, default: 0 },
  allocatedHours: { type: Number, default: 0 },
  role:           { type: String, default: '' },
  costRate:       { type: Number, default: 0 },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

resourceCapacitySchema.index({ employee: 1, period: 1 }, { unique: true });
resourceCapacitySchema.index({ portfolio: 1, period: 1 });

module.exports = mongoose.model('ResourceCapacity', resourceCapacitySchema);
