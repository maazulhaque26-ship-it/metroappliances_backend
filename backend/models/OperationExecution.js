'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const operationExecutionSchema = new Schema({
  executionNumber:   { type: String, unique: true },
  workOrder:         { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  workOrderOperation:{ type: Schema.Types.ObjectId, ref: 'WorkOrderOperation' },
  operator:          { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName:      { type: String, default: '' },
  machine:           { type: Schema.Types.ObjectId, ref: 'Machine' },
  workCenter:        { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  startTime:         { type: Date, required: true },
  endTime:           { type: Date },
  durationMins:      { type: Number, default: 0, min: 0 },
  quantityProduced:  { type: Number, default: 0, min: 0 },
  quantityScrap:     { type: Number, default: 0, min: 0 },
  quantityRework:    { type: Number, default: 0, min: 0 },
  status:            { type: String, enum: ['in_progress','completed','failed','cancelled'], default: 'in_progress' },
  notes:             { type: String, default: '' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

operationExecutionSchema.index({ workOrder: 1, startTime: -1 });
operationExecutionSchema.index({ machine: 1, startTime: -1 });
operationExecutionSchema.index({ operator: 1, startTime: -1 });

operationExecutionSchema.pre('validate', async function (next) {
  if (this.isNew && !this.executionNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('OperationExecution').countDocuments();
    this.executionNumber = `OEX-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('OperationExecution', operationExecutionSchema);
