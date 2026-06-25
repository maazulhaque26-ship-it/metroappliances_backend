'use strict';
const mongoose = require('mongoose');

const employeeCertificationSchema = new mongoose.Schema({
  employee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  certName:       { type: String, required: true, trim: true },
  issuingOrg:     { type: String, required: true, trim: true },
  certNumber:     { type: String, default: '', trim: true },
  issueDate:      { type: Date },
  expiryDate:     { type: Date },
  isLifetime:     { type: Boolean, default: false },
  certUrl:        { type: String, default: '' },
  fileUrl:        { type: String, default: '' },
  isVerified:     { type: Boolean, default: false },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

employeeCertificationSchema.index({ employee: 1 });
employeeCertificationSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('EmployeeCertification', employeeCertificationSchema);
