'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const workOrderOperationSchema = new Schema({
  workOrder:     { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  sequence:      { type: Number, required: true, min: 1 },
  operationName: { type: String, required: true },
  operationType: { type: String, enum: ['machining','assembly','welding','painting','testing','inspection','packaging','other'], default: 'assembly' },
  workCenter:    { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  machine:       { type: Schema.Types.ObjectId, ref: 'Machine' },
  shift:         { type: Schema.Types.ObjectId, ref: 'Shift' },
  operator:      { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName:  { type: String, default: '' },
  estimatedDurationMins: { type: Number, default: 0, min: 0 },
  actualDurationMins:    { type: Number, default: 0, min: 0 },
  setupTimeMins:         { type: Number, default: 0, min: 0 },
  plannedQty:    { type: Number, default: 0, min: 0 },
  completedQty:  { type: Number, default: 0, min: 0 },
  scrapQty:      { type: Number, default: 0, min: 0 },
  status:        { type: String, enum: ['pending','in_progress','completed','skipped','failed'], default: 'pending' },
  startedAt:     { type: Date },
  completedAt:   { type: Date },
  instructions:  { type: String, default: '' },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

workOrderOperationSchema.index({ workOrder: 1, sequence: 1 });
workOrderOperationSchema.index({ machine: 1, status: 1 });
workOrderOperationSchema.index({ workOrder: 1, status: 1 });

module.exports = mongoose.model('WorkOrderOperation', workOrderOperationSchema);
