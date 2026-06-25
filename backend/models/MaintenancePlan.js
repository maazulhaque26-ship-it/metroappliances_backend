'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenancePlanSchema = new Schema({
  planNumber:      { type: String, unique: true },
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  maintenanceType: { type: String, enum: ['preventive','predictive','corrective','emergency','condition_based','time_based','usage_based'], required: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset' },
  assetCategory:   { type: Schema.Types.ObjectId, ref: 'AssetCategory' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  // Recurrence
  recurrenceType:  { type: String, enum: ['one_time','daily','weekly','monthly','quarterly','semi_annual','annual','custom','meter_based'], default: 'monthly' },
  intervalDays:    { type: Number, default: 0 },
  intervalHours:   { type: Number, default: 0 },  // meter-based
  intervalCycles:  { type: Number, default: 0 },
  // Scheduling
  startDate:       { type: Date },
  endDate:         { type: Date },
  nextScheduledDate: { type: Date },
  leadTimeDays:    { type: Number, default: 7 },
  estimatedDuration: { type: Number, default: 0 },  // minutes
  estimatedCost:   { type: Number, default: 0 },
  // Assignment
  assignedTeam:    { type: String, default: '' },
  assignedTo:      { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:  { type: String, default: '' },
  priority:        { type: String, enum: ['low','normal','high','critical'], default: 'normal' },
  // Approval
  requiresApproval:{ type: Boolean, default: false },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:  { type: String, default: '' },
  // Status
  status:          { type: String, enum: ['draft','active','paused','completed','cancelled'], default: 'draft' },
  isActive:        { type: Boolean, default: true },
  autoGenerate:    { type: Boolean, default: true },
  totalWorkOrders: { type: Number, default: 0 },
  completedWorkOrders: { type: Number, default: 0 },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenancePlanSchema.index({ asset: 1, status: 1 });
maintenancePlanSchema.index({ assetCategory: 1, maintenanceType: 1 });
maintenancePlanSchema.index({ nextScheduledDate: 1, isActive: 1 });
maintenancePlanSchema.index({ status: 1, priority: -1 });

maintenancePlanSchema.pre('validate', async function (next) {
  if (this.isNew && !this.planNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenancePlan').countDocuments();
    this.planNumber = `MP-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenancePlan', maintenancePlanSchema);
