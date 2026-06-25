'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const laborTrackingSchema = new Schema({
  trackingNumber: { type: String, unique: true },
  workOrder:      { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  operator:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  operatorName:   { type: String, default: '' },
  factory:        { type: Schema.Types.ObjectId, ref: 'Factory' },
  shift:          { type: Schema.Types.ObjectId, ref: 'Shift' },
  workCenter:     { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  date:           { type: Date, required: true },
  clockIn:        { type: Date },
  clockOut:       { type: Date },
  totalHours:     { type: Number, default: 0, min: 0 },
  overtimeHours:  { type: Number, default: 0, min: 0 },
  productionQty:  { type: Number, default: 0, min: 0 },
  efficiencyPct:  { type: Number, default: 0, min: 0, max: 200 },
  laborCostPerHour:{ type: Number, default: 0, min: 0 },
  totalLaborCost: { type: Number, default: 0, min: 0 },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

laborTrackingSchema.index({ workOrder: 1, date: -1 });
laborTrackingSchema.index({ operator: 1, date: -1 });
laborTrackingSchema.index({ factory: 1, date: -1 });

laborTrackingSchema.pre('validate', async function (next) {
  if (this.isNew && !this.trackingNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('LaborTracking').countDocuments();
    this.trackingNumber = `LBR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('LaborTracking', laborTrackingSchema);
