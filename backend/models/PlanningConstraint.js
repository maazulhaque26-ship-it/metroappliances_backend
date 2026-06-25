'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const planningConstraintSchema = new Schema({
  factory:        { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  workCenter:     { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  machine:        { type: Schema.Types.ObjectId, ref: 'Machine' },
  constraintType: {
    type: String,
    enum: ['capacity','material','shift','maintenance','operator','holiday'],
    required: true,
  },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  value:       { type: Number, default: 0 },
  unit:        { type: String, default: '' },
  severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  validFrom:   { type: Date, required: true },
  validTo:     { type: Date },
  isActive:    { type: Boolean, default: true },
  notes:       { type: String, default: '' },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

planningConstraintSchema.index({ factory: 1, isActive: 1 });
planningConstraintSchema.index({ validFrom: 1, validTo: 1 });
planningConstraintSchema.index({ constraintType: 1 });
planningConstraintSchema.index({ severity: 1 });

module.exports = mongoose.model('PlanningConstraint', planningConstraintSchema);
