'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const taxAuditSchema = new Schema({
  auditNumber:   { type: String, unique: true },
  auditType:     { type: String, enum: ['GST_audit','TDS_audit','income_tax','VAT','internal','external'], required: true },
  fiscalYear:    { type: String, required: true, trim: true },
  period:        { type: String, trim: true },
  auditStartDate:{ type: Date },
  auditEndDate:  { type: Date },
  auditorName:   { type: String, trim: true },
  auditorFirm:   { type: String, trim: true },
  turnover:      { type: Number, default: 0 },
  totalTaxPayable:{ type: Number, default: 0 },
  totalTaxPaid:   { type: Number, default: 0 },
  difference:     { type: Number, default: 0 },
  observations:   { type: String, trim: true },
  recommendations:{ type: String, trim: true },
  status:         { type: String, enum: ['planned','in_progress','completed','submitted','closed'], default: 'planned' },
  submissionDate: { type: Date },
  acknowledgementNo: { type: String, trim: true },
  attachments:    [{ url: String, name: String }],
  assignedTo:     { type: ObjectId, ref: 'User' },
  createdBy:      { type: ObjectId, ref: 'User' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

taxAuditSchema.index({ fiscalYear: 1, auditType: 1 });
taxAuditSchema.index({ status: 1 });

taxAuditSchema.pre('validate', async function (next) {
  if (!this.auditNumber) {
    const yr = new Date().getFullYear();
    const prefix = `TXAUD-${yr}-`;
    const count = await this.constructor.countDocuments({ auditNumber: { $regex: `^${prefix}` } });
    this.auditNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('TaxAudit', taxAuditSchema);
