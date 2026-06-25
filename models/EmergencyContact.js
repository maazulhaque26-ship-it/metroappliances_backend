'use strict';
const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  name:         { type: String, required: true, trim: true },
  relationship: { type: String, enum: ['spouse','parent','sibling','child','friend','other'], required: true },
  phone:        { type: String, required: true, trim: true },
  altPhone:     { type: String, default: '', trim: true },
  email:        { type: String, default: '', trim: true, lowercase: true },
  address:      { type: String, default: '', trim: true },
  isPrimary:    { type: Boolean, default: false },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

emergencyContactSchema.index({ employee: 1 });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
