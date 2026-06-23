'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const taxExemptionSchema = new Schema({
  exemptionNumber: { type: String, unique: true },
  exemptionType:   { type: String, enum: ['GST','TDS','both'], required: true },
  partyType:       { type: String, enum: ['vendor','customer','product','category'], required: true },
  vendor:          { type: ObjectId, ref: 'Vendor' },
  partyName:       { type: String, required: true, trim: true },
  reason:          { type: String, required: true, trim: true },
  legalBasis:      { type: String, trim: true },
  certificateNumber: { type: String, trim: true },
  issueDate:       { type: Date },
  expiryDate:      { type: Date },
  igstExempt:      { type: Boolean, default: false },
  cgstExempt:      { type: Boolean, default: false },
  sgstExempt:      { type: Boolean, default: false },
  tdsExempt:       { type: Boolean, default: false },
  exemptRate:      { type: Number, default: 0 },
  status:          { type: String, enum: ['active','expired','cancelled','pending'], default: 'active' },
  approvedBy:      { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

taxExemptionSchema.index({ status: 1 });
taxExemptionSchema.index({ expiryDate: 1 });
taxExemptionSchema.index({ vendor: 1 });

taxExemptionSchema.pre('validate', async function (next) {
  if (!this.exemptionNumber) {
    const yr = new Date().getFullYear();
    const prefix = `TXEX-${yr}-`;
    const count = await this.constructor.countDocuments({ exemptionNumber: { $regex: `^${prefix}` } });
    this.exemptionNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('TaxExemption', taxExemptionSchema);
