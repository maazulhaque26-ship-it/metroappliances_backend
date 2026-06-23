'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceRequestSchema = new Schema({
  requestNumber:   { type: String, unique: true },
  title:           { type: String, required: true },
  description:     { type: String, required: true },
  requestType:     { type: String, enum: ['breakdown','preventive','inspection','improvement','safety','other'], default: 'breakdown' },
  asset:           { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName:       { type: String, default: '' },
  assetNumber:     { type: String, default: '' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  department:      { type: String, default: '' },
  priority:        { type: String, enum: ['low','normal','high','critical','emergency'], default: 'normal' },
  status:          { type: String, enum: ['open','acknowledged','in_review','approved','rejected','converted','closed'], default: 'open' },
  requestedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  requestedByName: { type: String, default: '' },
  requestedAt:     { type: Date, default: Date.now },
  acknowledgedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  acknowledgedByName: { type: String, default: '' },
  acknowledgedAt:  { type: Date },
  reviewedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedByName:  { type: String, default: '' },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:  { type: String, default: '' },
  approvedAt:      { type: Date },
  rejectionReason: { type: String, default: '' },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  workOrderNumber: { type: String, default: '' },
  imageUrls:       [{ type: String }],
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

maintenanceRequestSchema.index({ status: 1, priority: -1 });
maintenanceRequestSchema.index({ asset: 1, status: 1 });
maintenanceRequestSchema.index({ requestedBy: 1, status: 1 });
maintenanceRequestSchema.index({ factory: 1, status: 1 });

maintenanceRequestSchema.pre('validate', async function (next) {
  if (this.isNew && !this.requestNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceRequest').countDocuments();
    this.requestNumber = `MR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
