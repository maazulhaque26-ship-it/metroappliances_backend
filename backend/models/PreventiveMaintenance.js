'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const preventiveMaintenanceSchema = new Schema({
  pmNumber:        { type: String, unique: true },
  maintenancePlan: { type: Schema.Types.ObjectId, ref: 'MaintenancePlan', required: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  scheduledDate:   { type: Date, required: true },
  completedDate:   { type: Date },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  // Scope
  activities:      [{ activity: String, completed: { type: Boolean, default: false } }],
  partsRequired:   [{ partName: String, partNumber: String, quantity: Number }],
  estimatedCost:   { type: Number, default: 0 },
  actualCost:      { type: Number, default: 0 },
  estimatedDuration: { type: Number, default: 0 },  // minutes
  actualDuration:    { type: Number, default: 0 },
  priority:        { type: String, enum: ['low','normal','high','critical'], default: 'normal' },
  status:          { type: String, enum: ['scheduled','in_progress','completed','cancelled','overdue'], default: 'scheduled' },
  assignedTo:      { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:  { type: String, default: '' },
  completedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  completedByName: { type: String, default: '' },
  result:          { type: String, enum: ['successful','partially_successful','failed','deferred'], default: 'successful' },
  nextPMDate:      { type: Date },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

preventiveMaintenanceSchema.index({ asset: 1, scheduledDate: 1 });
preventiveMaintenanceSchema.index({ maintenancePlan: 1, scheduledDate: 1 });
preventiveMaintenanceSchema.index({ status: 1, scheduledDate: 1 });

preventiveMaintenanceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.pmNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('PreventiveMaintenance').countDocuments();
    this.pmNumber = `PM-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PreventiveMaintenance', preventiveMaintenanceSchema);
