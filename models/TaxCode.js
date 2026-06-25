'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const taxCodeSchema = new Schema({
  code:          { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:          { type: String, required: true, trim: true },
  taxType:       { type: String, enum: ['GST','TDS','TCS','VAT','excise','custom'], required: true },
  description:   { type: String, trim: true },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

taxCodeSchema.index({ taxType: 1, isActive: 1 });

module.exports = mongoose.model('TaxCode', taxCodeSchema);
