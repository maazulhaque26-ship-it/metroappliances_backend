'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenancePlannerSchema = new Schema({
  plannerNumber:   { type: String, unique: true },
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  plannerType:     { type: String, enum: ['weekly','monthly','quarterly','annual','custom'], required: true },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  department:      { type: String, default: '' },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, required: true },
  // Planner items - scheduled work orders
  items: [{
    asset:           { type: Schema.Types.ObjectId, ref: 'Asset' },
    assetName:       String,
    maintenancePlan: { type: Schema.Types.ObjectId, ref: 'MaintenancePlan' },
    maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
    scheduledDate:   Date,
    estimatedHours:  Number,
    assignedTo:      { type: Schema.Types.ObjectId, ref: 'User' },
    assignedToName:  String,
    status:          { type: String, enum: ['planned','scheduled','in_progress','completed','cancelled'], default: 'planned' },
  }],
  totalPlanned:    { type: Number, default: 0 },
  totalCompleted:  { type: Number, default: 0 },
  totalOverdue:    { type: Number, default: 0 },
  complianceRate:  { type: Number, default: 0 },
  estimatedCost:   { type: Number, default: 0 },
  actualCost:      { type: Number, default: 0 },
  createdBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  createdByName:   { type: String, default: '' },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:  { type: String, default: '' },
  status:          { type: String, enum: ['draft','approved','active','completed','cancelled'], default: 'draft' },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenancePlannerSchema.index({ factory: 1, status: 1 });
maintenancePlannerSchema.index({ startDate: 1, endDate: 1 });
maintenancePlannerSchema.index({ status: 1 });

maintenancePlannerSchema.pre('validate', async function (next) {
  if (this.isNew && !this.plannerNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenancePlanner').countDocuments();
    this.plannerNumber = `MPLR-${yr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenancePlanner', maintenancePlannerSchema);
