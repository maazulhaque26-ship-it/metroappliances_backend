'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const tdsDepositSchema = new Schema({
  depositNumber:  { type: String, unique: true },
  depositDate:    { type: Date, required: true, default: Date.now },
  assessmentYear: { type: String, required: true, trim: true },
  quarter:        { type: String, enum: ['Q1','Q2','Q3','Q4'], required: true },
  month:          { type: String, trim: true },
  sections:       [{ type: String }],
  deductions:     [{ type: ObjectId, ref: 'TDSDeduction' }],
  totalAmount:    { type: Number, required: true, default: 0 },
  interestAmount: { type: Number, default: 0 },
  lateFeesAmount: { type: Number, default: 0 },
  totalDeposited: { type: Number, default: 0 },
  challanNumber:  { type: String, trim: true },
  challanDate:    { type: Date },
  bankName:       { type: String, trim: true },
  bsrCode:        { type: String, trim: true },
  minorHead:      { type: String, default: '200' },
  paymentMode:    { type: String, enum: ['net_banking','challan','eway'], default: 'net_banking' },
  status:         { type: String, enum: ['draft','deposited','acknowledged'], default: 'draft' },
  journalEntry:   { type: ObjectId, ref: 'JournalEntry' },
  glPosted:       { type: Boolean, default: false },
  depositedBy:    { type: ObjectId, ref: 'User' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

tdsDepositSchema.index({ assessmentYear: 1, quarter: 1 });
tdsDepositSchema.index({ depositDate: -1 });
tdsDepositSchema.index({ status: 1 });

tdsDepositSchema.pre('validate', async function (next) {
  if (!this.depositNumber) {
    const yr = new Date().getFullYear();
    const prefix = `TDSDEP-${yr}-`;
    const count = await this.constructor.countDocuments({ depositNumber: { $regex: `^${prefix}` } });
    this.depositNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('TDSDeposit', tdsDepositSchema);
