'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceWorkOrderSchema = new Schema({
  workOrderNumber: { type: String, unique: true },
  title:           { type: String, required: true },
  description:     { type: String, default: '' },
  maintenanceType: { type: String, enum: ['preventive','corrective','predictive','emergency','condition_based','inspection','overhaul'], required: true },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  assetNumber:     { type: String, default: '' },
  maintenancePlan: { type: Schema.Types.ObjectId, ref: 'MaintenancePlan' },
  maintenanceSchedule: { type: Schema.Types.ObjectId, ref: 'MaintenanceSchedule' },
  breakdownRecord: { type: Schema.Types.ObjectId, ref: 'BreakdownRecord' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  department:      { type: String, default: '' },
  // Priority & lifecycle
  priority:        { type: String, enum: ['low','normal','high','critical','emergency'], default: 'normal' },
  status:          { type: String, enum: ['draft','planned','approved','assigned','in_progress','paused','completed','verified','closed','cancelled'], default: 'draft' },
  // Scheduling
  plannedStartDate:  { type: Date },
  plannedEndDate:    { type: Date },
  actualStartDate:   { type: Date },
  actualEndDate:     { type: Date },
  estimatedDuration: { type: Number, default: 0 },   // minutes
  actualDuration:    { type: Number, default: 0 },
  // Assignment
  assignedTo:      { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:  { type: String, default: '' },
  technician:      { type: Schema.Types.ObjectId, ref: 'Technician' },
  technicianName:  { type: String, default: '' },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:  { type: String, default: '' },
  approvedAt:      { type: Date },
  verifiedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedByName:  { type: String, default: '' },
  verifiedAt:      { type: Date },
  closedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  closedByName:    { type: String, default: '' },
  closedAt:        { type: Date },
  // Costs
  estimatedCost:   { type: Number, default: 0 },
  actualLaborCost: { type: Number, default: 0 },
  actualPartsCost: { type: Number, default: 0 },
  actualTotalCost: { type: Number, default: 0 },
  // Downtime
  downtimeHours:   { type: Number, default: 0 },
  // Completion
  workDone:        { type: String, default: '' },
  findings:        { type: String, default: '' },
  recommendations: { type: String, default: '' },
  completionNotes: { type: String, default: '' },
  attachmentUrls:  [{ type: String }],
  // Escalation
  escalated:       { type: Boolean, default: false },
  escalatedAt:     { type: Date },
  escalationReason:{ type: String, default: '' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenanceWorkOrderSchema.index({ asset: 1, status: 1 });
maintenanceWorkOrderSchema.index({ status: 1, priority: -1 });
maintenanceWorkOrderSchema.index({ maintenanceType: 1, status: 1 });
maintenanceWorkOrderSchema.index({ assignedTo: 1, status: 1 });
maintenanceWorkOrderSchema.index({ plannedStartDate: 1, status: 1 });
maintenanceWorkOrderSchema.index({ factory: 1, status: 1 });

maintenanceWorkOrderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.workOrderNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceWorkOrder').countDocuments();
    this.workOrderNumber = `MWO-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceWorkOrder', maintenanceWorkOrderSchema);
