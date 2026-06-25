'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceScheduleSchema = new Schema({
  scheduleNumber:  { type: String, unique: true },
  maintenancePlan: { type: Schema.Types.ObjectId, ref: 'MaintenancePlan', required: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  maintenanceType: { type: String, enum: ['preventive','predictive','corrective','emergency','condition_based','time_based','usage_based'], default: 'preventive' },
  scheduledDate:   { type: Date, required: true },
  dueDate:         { type: Date, required: true },
  completedDate:   { type: Date },
  estimatedDuration: { type: Number, default: 0 },  // minutes
  actualDuration:    { type: Number, default: 0 },
  estimatedCost:   { type: Number, default: 0 },
  actualCost:      { type: Number, default: 0 },
  priority:        { type: String, enum: ['low','normal','high','critical'], default: 'normal' },
  status:          { type: String, enum: ['scheduled','in_progress','completed','cancelled','overdue','skipped'], default: 'scheduled' },
  assignedTo:      { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:  { type: String, default: '' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenanceScheduleSchema.index({ maintenancePlan: 1, scheduledDate: 1 });
maintenanceScheduleSchema.index({ asset: 1, scheduledDate: 1 });
maintenanceScheduleSchema.index({ scheduledDate: 1, status: 1 });
maintenanceScheduleSchema.index({ dueDate: 1, status: 1 });

maintenanceScheduleSchema.pre('validate', async function (next) {
  if (this.isNew && !this.scheduleNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceSchedule').countDocuments();
    this.scheduleNumber = `MS-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
