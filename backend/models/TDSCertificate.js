'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const tdsCertificateSchema = new Schema({
  certificateNumber: { type: String, unique: true },
  certificateType:   { type: String, enum: ['16A','16B','16C','27D'], required: true },
  tdsSection:        { type: ObjectId, ref: 'TDSSection' },
  section:           { type: String, trim: true },
  deductorName:      { type: String, required: true, trim: true },
  deductorTAN:       { type: String, trim: true },
  deductorPAN:       { type: String, trim: true },
  deducteeName:      { type: String, required: true, trim: true },
  deducteePAN:       { type: String, trim: true },
  assessmentYear:    { type: String, required: true, trim: true },
  quarter:           { type: String, enum: ['Q1','Q2','Q3','Q4'], required: true },
  grossAmount:       { type: Number, default: 0 },
  tdsDeducted:       { type: Number, default: 0 },
  tdsDeposited:      { type: Number, default: 0 },
  status:            { type: String, enum: ['draft','generated','issued','revised','cancelled'], default: 'draft' },
  issueDate:         { type: Date },
  vendor:            { type: ObjectId, ref: 'Vendor' },
  tdsDeposit:        { type: ObjectId, ref: 'TDSDeposit' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

tdsCertificateSchema.index({ assessmentYear: 1, quarter: 1 });
tdsCertificateSchema.index({ deducteePAN: 1 });
tdsCertificateSchema.index({ status: 1 });

tdsCertificateSchema.pre('validate', async function (next) {
  if (!this.certificateNumber) {
    const yr = new Date().getFullYear();
    const prefix = `TDSC-${yr}-`;
    const count = await this.constructor.countDocuments({ certificateNumber: { $regex: `^${prefix}` } });
    this.certificateNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('TDSCertificate', tdsCertificateSchema);
