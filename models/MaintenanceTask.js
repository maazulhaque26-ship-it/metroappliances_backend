'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceTaskSchema = new Schema({
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder', required: true },
  maintenancePlan:      { type: Schema.Types.ObjectId, ref: 'MaintenancePlan' },
  taskName:    { type: String, required: true },
  description: { type: String, default: '' },
  taskType:    { type: String, enum: ['inspection','repair','replacement','lubrication','calibration','cleaning','adjustment','testing','documentation','other'], default: 'inspection' },
  sequence:    { type: Number, default: 1 },
  estimatedTime: { type: Number, default: 0 },  // minutes
  actualTime:    { type: Number, default: 0 },
  assignedTo:    { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:{ type: String, default: '' },
  status:        { type: String, enum: ['pending','in_progress','completed','skipped','failed'], default: 'pending' },
  completedAt:   { type: Date },
  completedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  completedByName: { type: String, default: '' },
  result:        { type: String, default: '' },
  isRequired:    { type: Boolean, default: true },
  requiresSignOff: { type: Boolean, default: false },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

maintenanceTaskSchema.index({ maintenanceWorkOrder: 1, sequence: 1 });
maintenanceTaskSchema.index({ status: 1 });

module.exports = mongoose.model('MaintenanceTask', maintenanceTaskSchema);
