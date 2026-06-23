'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const machineDowntimeSchema = new Schema({
  downtimeNumber: { type: String, unique: true },
  machine:        { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
  factory:        { type: Schema.Types.ObjectId, ref: 'Factory' },
  workCenter:     { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  workOrder:      { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  reason:         { type: String, enum: ['breakdown','maintenance','power_failure','material_shortage','operator_waiting','tool_change','cleaning','calibration','setup','unknown'], default: 'unknown' },
  category:       { type: String, enum: ['planned','unplanned'], default: 'unplanned' },
  description:    { type: String, default: '' },
  startTime:      { type: Date, required: true },
  endTime:        { type: Date },
  durationMins:   { type: Number, default: 0, min: 0 },
  reportedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  reportedByName: { type: String, default: '' },
  resolvedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedByName: { type: String, default: '' },
  resolvedAt:     { type: Date },
  rootCause:      { type: String, default: '' },
  correctiveAction: { type: String, default: '' },
  status:         { type: String, enum: ['open','in_progress','resolved'], default: 'open' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

machineDowntimeSchema.index({ machine: 1, startTime: -1 });
machineDowntimeSchema.index({ factory: 1, category: 1 });
machineDowntimeSchema.index({ status: 1, reason: 1 });
machineDowntimeSchema.index({ workOrder: 1 });

machineDowntimeSchema.pre('validate', async function (next) {
  if (this.isNew && !this.downtimeNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MachineDowntime').countDocuments();
    this.downtimeNumber = `MDT-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MachineDowntime', machineDowntimeSchema);
