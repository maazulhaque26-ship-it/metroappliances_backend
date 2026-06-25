'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const taxJurisdictionSchema = new Schema({
  code:         { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:         { type: String, required: true, trim: true },
  country:      { type: String, default: 'India', trim: true },
  state:        { type: String, trim: true },
  stateCode:    { type: String, trim: true },
  gstStateCode: { type: String, trim: true },
  isUnionTerritory: { type: Boolean, default: false },
  isSpecialCategory:{ type: Boolean, default: false },
  defaultTaxType:   { type: String, enum: ['CGST_SGST','IGST'], default: 'CGST_SGST' },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

taxJurisdictionSchema.index({ country: 1, state: 1 });
taxJurisdictionSchema.index({ stateCode: 1 });

module.exports = mongoose.model('TaxJurisdiction', taxJurisdictionSchema);
