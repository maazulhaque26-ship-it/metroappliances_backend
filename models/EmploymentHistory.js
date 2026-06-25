'use strict';
const mongoose = require('mongoose');

const employmentHistorySchema = new mongoose.Schema({
  employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  company:       { type: String, required: true, trim: true },
  designation:   { type: String, required: true, trim: true },
  department:    { type: String, default: '', trim: true },
  startDate:     { type: Date, required: true },
  endDate:       { type: Date },
  ctc:           { type: Number, default: 0 },
  reasonForLeaving:{ type: String, default: '', trim: true },
  refName:       { type: String, default: '', trim: true },
  refPhone:      { type: String, default: '', trim: true },
  isVerified:    { type: Boolean, default: false },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

employmentHistorySchema.index({ employee: 1, startDate: -1 });

module.exports = mongoose.model('EmploymentHistory', employmentHistorySchema);
