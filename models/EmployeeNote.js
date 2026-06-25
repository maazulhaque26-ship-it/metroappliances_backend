'use strict';
const mongoose = require('mongoose');

const employeeNoteSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  noteType:    { type: String, enum: ['general','performance','disciplinary','appreciation','warning','medical','confidential'], default: 'general' },
  title:       { type: String, required: true, trim: true },
  content:     { type: String, required: true },
  isConfidential:{ type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

employeeNoteSchema.index({ employee: 1, createdAt: -1 });
employeeNoteSchema.index({ noteType: 1 });

module.exports = mongoose.model('EmployeeNote', employeeNoteSchema);
