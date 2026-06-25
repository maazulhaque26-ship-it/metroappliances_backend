'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const qualityCheckpointSchema = new Schema({
  checkpointNumber: { type: String, unique: true },
  workOrder:        { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  workOrderOperation: { type: Schema.Types.ObjectId, ref: 'WorkOrderOperation' },
  name:             { type: String, required: true },
  description:      { type: String, default: '' },
  parameter:        { type: String, default: '' },
  minValue:         { type: Number },
  maxValue:         { type: Number },
  targetValue:      { type: Number },
  unit:             { type: String, default: '' },
  checkMethod:      { type: String, enum: ['visual','measurement','functional','document','automated'], default: 'visual' },
  isRequired:       { type: Boolean, default: true },
  sequence:         { type: Number, default: 1 },
  result:           { type: String, enum: ['pass','fail','pending','na'], default: 'pending' },
  actualValue:      { type: Number },
  checkedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  checkedByName:    { type: String, default: '' },
  checkedAt:        { type: Date },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

qualityCheckpointSchema.index({ workOrder: 1, sequence: 1 });
qualityCheckpointSchema.index({ workOrder: 1, result: 1 });

qualityCheckpointSchema.pre('validate', async function (next) {
  if (this.isNew && !this.checkpointNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('QualityCheckpoint').countDocuments();
    this.checkpointNumber = `QCP-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('QualityCheckpoint', qualityCheckpointSchema);
