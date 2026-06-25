'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const tdsDeductionSchema = new Schema({
  deductionNumber: { type: String, unique: true },
  tdsSection:      { type: ObjectId, ref: 'TDSSection', required: true },
  section:         { type: String, required: true, trim: true },
  deductionDate:   { type: Date,   required: true, default: Date.now },
  partyType:       { type: String, enum: ['vendor','customer','employee'], default: 'vendor' },
  vendor:          { type: ObjectId, ref: 'Vendor' },
  partyName:       { type: String, required: true, trim: true },
  partyPAN:        { type: String, trim: true },
  grossAmount:     { type: Number, required: true, min: 0 },
  tdsRate:         { type: Number, required: true, min: 0 },
  surchargeRate:   { type: Number, default: 0 },
  cessRate:        { type: Number, default: 0 },
  tdsAmount:       { type: Number, required: true, min: 0 },
  netAmount:       { type: Number, default: 0 },
  assessmentYear:  { type: String, trim: true },
  quarter:         { type: String, enum: ['Q1','Q2','Q3','Q4'] },
  sourceType:      { type: String, enum: ['vendor_bill','vendor_payment','customer_invoice','manual'], default: 'vendor_payment' },
  vendorBill:      { type: ObjectId, ref: 'VendorBill' },
  vendorPayment:   { type: ObjectId, ref: 'VendorPayment' },
  tdsDeposit:      { type: ObjectId, ref: 'TDSDeposit' },
  certificate:     { type: ObjectId, ref: 'TDSCertificate' },
  journalEntry:    { type: ObjectId, ref: 'JournalEntry' },
  glPosted:        { type: Boolean, default: false },
  status:          { type: String, enum: ['pending','deposited','certified','reversed'], default: 'pending' },
  createdBy:       { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

tdsDeductionSchema.index({ section: 1, deductionDate: -1 });
tdsDeductionSchema.index({ assessmentYear: 1, quarter: 1 });
tdsDeductionSchema.index({ status: 1 });
tdsDeductionSchema.index({ vendor: 1 });

tdsDeductionSchema.pre('validate', async function (next) {
  if (!this.deductionNumber) {
    const yr = new Date().getFullYear();
    const prefix = `TDSD-${yr}-`;
    const count = await this.constructor.countDocuments({ deductionNumber: { $regex: `^${prefix}` } });
    this.deductionNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.netAmount) this.netAmount = (this.grossAmount || 0) - (this.tdsAmount || 0);
  next();
});

module.exports = mongoose.model('TDSDeduction', tdsDeductionSchema);
