'use strict';
const mongoose = require('mongoose');

const SalaryComponentSchema = new mongoose.Schema({
  componentCode:     { type: String, unique: true },
  name:              { type: String, required: true, trim: true },
  type:              { type: String, enum: ['earning','deduction','employer_contribution'], required: true },
  calculationType:   { type: String, enum: ['fixed','percentage_of_basic','percentage_of_gross','slab','formula'], default: 'fixed' },
  value:             { type: Number, default: 0 },
  maxValue:          { type: Number },
  isStatutory:       { type: Boolean, default: false },
  statutoryType:     { type: String, enum: ['pf','esi','pt','tds','other',''] , default: '' },
  taxable:           { type: Boolean, default: false },
  sortOrder:         { type: Number, default: 0 },
  isActive:          { type: Boolean, default: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

SalaryComponentSchema.index({ type: 1, isActive: 1 });

SalaryComponentSchema.pre('validate', async function (next) {
  if (this.componentCode) return next();
  const count = await mongoose.model('SalaryComponent').countDocuments();
  this.componentCode = `SC-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('SalaryComponent', SalaryComponentSchema);
