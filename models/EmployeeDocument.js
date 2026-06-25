'use strict';
const mongoose = require('mongoose');

const employeeDocumentSchema = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  docType:      { type: String, enum: ['aadhar','pan','passport','offer_letter','appointment_letter','id_proof','address_proof','educational','experience','medical','nda','other'], required: true },
  docName:      { type: String, required: true, trim: true },
  fileUrl:      { type: String, default: '' },
  fileType:     { type: String, default: '' },
  expiryDate:   { type: Date },
  issueDate:    { type: Date },
  isVerified:   { type: Boolean, default: false },
  verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt:   { type: Date },
  notes:        { type: String, default: '' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

employeeDocumentSchema.index({ employee: 1, docType: 1 });
employeeDocumentSchema.index({ isVerified: 1 });

module.exports = mongoose.model('EmployeeDocument', employeeDocumentSchema);
