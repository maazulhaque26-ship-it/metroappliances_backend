'use strict';
const mongoose = require('mongoose');

const PayrollPeriodSchema = new mongoose.Schema({
  periodCode:  { type: String, unique: true },
  name:        { type: String, required: true, trim: true },
  periodType:  { type: String, enum: ['monthly','weekly','fortnightly'], default: 'monthly' },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  payDate:     { type: Date },
  fiscalYear:  { type: String, trim: true },
  workingDays: { type: Number, default: 0 },
  status:      { type: String, enum: ['open','processing','closed'], default: 'open' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

PayrollPeriodSchema.index({ status: 1, isDeleted: 1 });
PayrollPeriodSchema.index({ startDate: -1 });

PayrollPeriodSchema.pre('validate', async function (next) {
  if (this.periodCode) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('PayrollPeriod').countDocuments();
  this.periodCode = `PPD-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('PayrollPeriod', PayrollPeriodSchema);
