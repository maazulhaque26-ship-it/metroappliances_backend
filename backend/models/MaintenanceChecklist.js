'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const checklistItemSchema = new Schema({
  itemNumber:  { type: Number, required: true },
  description: { type: String, required: true },
  itemType:    { type: String, enum: ['yes_no','numeric','text','pass_fail','ok_not_ok'], default: 'yes_no' },
  expectedValue:  { type: String, default: '' },
  lowerLimit:     { type: Number },
  upperLimit:     { type: Number },
  unit:           { type: String, default: '' },
  isMandatory:    { type: Boolean, default: true },
  isCritical:     { type: Boolean, default: false },
  // Response
  response:    { type: String, default: '' },
  numericValue:{ type: Number },
  isPassed:    { type: Boolean },
  completedAt: { type: Date },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedByName: { type: String, default: '' },
  remarks:     { type: String, default: '' },
}, { _id: true });

const maintenanceChecklistSchema = new Schema({
  checklistNumber:    { type: String, unique: true },
  name:               { type: String, required: true },
  maintenanceWorkOrder: { type: Schema.Types.ObjectId, ref: 'MaintenanceWorkOrder' },
  maintenancePlan:    { type: Schema.Types.ObjectId, ref: 'MaintenancePlan' },
  asset:              { type: Schema.Types.ObjectId, ref: 'Asset' },
  assetCategory:      { type: Schema.Types.ObjectId, ref: 'AssetCategory' },
  checklistType:      { type: String, enum: ['pre_maintenance','post_maintenance','inspection','safety','handover'], default: 'inspection' },
  items:              [checklistItemSchema],
  status:             { type: String, enum: ['pending','in_progress','completed','failed'], default: 'pending' },
  completedAt:        { type: Date },
  overallResult:      { type: String, enum: ['pass','fail','conditional','pending'], default: 'pending' },
  conductedBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  conductedByName:    { type: String, default: '' },
  remarks:            { type: String, default: '' },
  isTemplate:         { type: Boolean, default: false },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

maintenanceChecklistSchema.index({ maintenanceWorkOrder: 1 });
maintenanceChecklistSchema.index({ asset: 1, checklistType: 1 });
maintenanceChecklistSchema.index({ status: 1 });

maintenanceChecklistSchema.pre('validate', async function (next) {
  if (this.isNew && !this.checklistNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceChecklist').countDocuments();
    this.checklistNumber = `MCL-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceChecklist', maintenanceChecklistSchema);
