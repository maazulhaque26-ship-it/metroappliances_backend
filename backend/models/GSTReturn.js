'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const gstReturnSchema = new Schema({
  returnNumber:    { type: String, unique: true },
  returnType:      { type: String, enum: ['GSTR-1','GSTR-2A','GSTR-2B','GSTR-3B','GSTR-4','GSTR-9','GSTR-9C'], required: true },
  period:          { type: String, required: true },     // e.g. "2026-04" or "2025-26" for annual
  gstin:           { type: String, required: true, trim: true },
  gstRegistration: { type: ObjectId, ref: 'GSTRegistration' },
  filingDate:      { type: Date },
  dueDate:         { type: Date },
  totalOutwardSupply:  { type: Number, default: 0 },
  totalInwardSupply:   { type: Number, default: 0 },
  totalOutputTax:      { type: Number, default: 0 },
  totalInputTax:       { type: Number, default: 0 },
  netTaxPayable:       { type: Number, default: 0 },
  igstPayable:     { type: Number, default: 0 },
  cgstPayable:     { type: Number, default: 0 },
  sgstPayable:     { type: Number, default: 0 },
  cessPayable:     { type: Number, default: 0 },
  lateFeePaid:     { type: Number, default: 0 },
  interestPaid:    { type: Number, default: 0 },
  status:          { type: String, enum: ['draft','filed','revised','nil','late'], default: 'draft' },
  acknowledgementNumber: { type: String, trim: true },
  arn:             { type: String, trim: true },          // Acknowledgement Reference Number
  filedBy:         { type: ObjectId, ref: 'User' },
  complianceTask:  { type: ObjectId, ref: 'ComplianceTask' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

gstReturnSchema.index({ period: -1, returnType: 1 });
gstReturnSchema.index({ gstin: 1, period: -1 });
gstReturnSchema.index({ status: 1 });

gstReturnSchema.pre('validate', async function (next) {
  if (!this.returnNumber) {
    const yr = new Date().getFullYear();
    const prefix = `GSTR-${yr}-`;
    const count = await this.constructor.countDocuments({ returnNumber: { $regex: `^${prefix}` } });
    this.returnNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('GSTReturn', gstReturnSchema);
