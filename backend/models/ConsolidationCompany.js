'use strict';
const mongoose = require('mongoose');

const consolidationCompanySchema = new mongoose.Schema({
  companyCode:   { type: String, unique: true },
  companyName:   { type: String, required: true, trim: true },
  group:         { type: mongoose.Schema.Types.ObjectId, ref: 'ConsolidationGroup', required: true },
  entityType:    { type: String, enum: ['branch','factory','warehouse','company','division'], default: 'branch' },
  entityRef:     { type: String, trim: true },
  currency:      { type: String, default: 'INR', uppercase: true },
  ownershipPct:  { type: Number, default: 100, min: 0, max: 100 },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

consolidationCompanySchema.pre('validate', async function (next) {
  if (this.companyCode) return next();
  const count = await this.constructor.countDocuments();
  this.companyCode = `CC-${String(count + 1).padStart(4, '0')}`;
  next();
});

consolidationCompanySchema.index({ group: 1, entityType: 1 });

module.exports = mongoose.model('ConsolidationCompany', consolidationCompanySchema);
