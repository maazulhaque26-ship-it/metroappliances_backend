'use strict';
const mongoose = require('mongoose');

const reportingRelationshipSchema = new mongoose.Schema({
  employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  manager:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  relationshipType:{ type: String, enum: ['primary','secondary','dotted_line','functional'], default: 'primary' },
  effectiveFrom: { type: Date, required: true },
  effectiveTo:   { type: Date },
  isActive:      { type: Boolean, default: true },
  notes:         { type: String, default: '' },
}, { timestamps: true });

reportingRelationshipSchema.index({ employee: 1, isActive: 1 });
reportingRelationshipSchema.index({ manager: 1, isActive: 1 });

module.exports = mongoose.model('ReportingRelationship', reportingRelationshipSchema);
