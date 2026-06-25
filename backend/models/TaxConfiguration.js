'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const taxConfigurationSchema = new Schema({
  key:           { type: String, required: true, unique: true, trim: true },
  value:         { type: Schema.Types.Mixed, required: true },
  category:      { type: String, enum: ['GST','TDS','einvoice','ewaybill','compliance','general'], required: true },
  description:   { type: String, trim: true },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

taxConfigurationSchema.index({ category: 1 });

module.exports = mongoose.model('TaxConfiguration', taxConfigurationSchema);
