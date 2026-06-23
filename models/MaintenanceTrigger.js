'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const maintenanceTriggerSchema = new Schema({
  triggerNumber: { type: String, unique: true },
  machine:       { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
  factory:       { type: Schema.Types.ObjectId, ref: 'Factory' },
  triggerType:   { type: String, enum: ['runtime','cycles','date','condition'], required: true },
  triggerName:   { type: String, required: true },
  description:   { type: String, default: '' },
  conditionValue:{ type: Number, default: 0, min: 0 },
  unit:          { type: String, default: '' },
  thresholdValue:{ type: Number, default: 0, min: 0 },
  isActive:      { type: Boolean, default: true },
  lastTriggeredAt: { type: Date },
  nextTriggerAt:   { type: Date },
  assignedTo:    { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:{ type: String, default: '' },
  priority:      { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:        { type: String, enum: ['active','triggered','in_progress','completed','overdue'], default: 'active' },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

maintenanceTriggerSchema.index({ machine: 1, status: 1 });
maintenanceTriggerSchema.index({ nextTriggerAt: 1, isActive: 1 });
maintenanceTriggerSchema.index({ status: 1, priority: -1 });

maintenanceTriggerSchema.pre('validate', async function (next) {
  if (this.isNew && !this.triggerNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MaintenanceTrigger').countDocuments();
    this.triggerNumber = `MTG-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaintenanceTrigger', maintenanceTriggerSchema);
