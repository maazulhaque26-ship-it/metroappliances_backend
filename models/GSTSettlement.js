'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const gstSettlementSchema = new Schema({
  settlementNumber: { type: String, unique: true },
  period:           { type: String, required: true },
  gstin:            { type: String, required: true, trim: true },
  gstRegistration:  { type: ObjectId, ref: 'GSTRegistration' },
  gstReturn:        { type: ObjectId, ref: 'GSTReturn' },
  settlementDate:   { type: Date, default: Date.now },
  // Input Tax Credits available
  itcIGST:          { type: Number, default: 0 },
  itcCGST:          { type: Number, default: 0 },
  itcSGST:          { type: Number, default: 0 },
  itcCess:          { type: Number, default: 0 },
  // Output Tax Liability
  liabilityIGST:    { type: Number, default: 0 },
  liabilityCGST:    { type: Number, default: 0 },
  liabilitySGST:    { type: Number, default: 0 },
  liabilityCess:    { type: Number, default: 0 },
  // Net payable after ITC utilization
  netIGST:          { type: Number, default: 0 },
  netCGST:          { type: Number, default: 0 },
  netSGST:          { type: Number, default: 0 },
  netCess:          { type: Number, default: 0 },
  totalPayable:     { type: Number, default: 0 },
  totalPaid:        { type: Number, default: 0 },
  challanNumber:    { type: String, trim: true },
  challanDate:      { type: Date },
  paymentMode:      { type: String, enum: ['net_banking','challan','credit_ledger'], default: 'net_banking' },
  status:           { type: String, enum: ['draft','calculated','paid','filed','adjusted'], default: 'draft' },
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  settledBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

gstSettlementSchema.index({ period: -1 });
gstSettlementSchema.index({ status: 1 });

gstSettlementSchema.pre('validate', async function (next) {
  if (!this.settlementNumber) {
    const yr = new Date().getFullYear();
    const prefix = `GSTSET-${yr}-`;
    const count = await this.constructor.countDocuments({ settlementNumber: { $regex: `^${prefix}` } });
    this.settlementNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('GSTSettlement', gstSettlementSchema);
