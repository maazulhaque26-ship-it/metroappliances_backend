'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionEventSchema = new Schema({
  eventNumber: { type: String, unique: true },
  eventType:   { type: String, enum: [
    'work_order_created','work_order_released','work_order_started','work_order_paused',
    'work_order_completed','work_order_cancelled','operation_started','operation_completed',
    'inspection_passed','inspection_failed','defect_recorded','downtime_started','downtime_ended',
    'tool_change','scrap_reported','rework_started','rework_completed','oee_calculated',
    'machine_status_change','operator_clocked_in','operator_clocked_out','other',
  ], required: true },
  workOrder:   { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  machine:     { type: Schema.Types.ObjectId, ref: 'Machine' },
  operator:    { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName:{ type: String, default: '' },
  factory:     { type: Schema.Types.ObjectId, ref: 'Factory' },
  timestamp:   { type: Date, default: Date.now },
  message:     { type: String, required: true },
  severity:    { type: String, enum: ['info','warning','critical'], default: 'info' },
  metadata:    { type: Schema.Types.Mixed, default: {} },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

productionEventSchema.index({ workOrder: 1, timestamp: -1 });
productionEventSchema.index({ factory: 1, timestamp: -1 });
productionEventSchema.index({ eventType: 1, timestamp: -1 });
productionEventSchema.index({ severity: 1, timestamp: -1 });

productionEventSchema.pre('validate', async function (next) {
  if (this.isNew && !this.eventNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ProductionEvent').countDocuments();
    this.eventNumber = `PEV-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductionEvent', productionEventSchema);
