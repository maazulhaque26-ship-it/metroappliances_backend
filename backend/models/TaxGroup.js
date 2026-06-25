'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const taxGroupSchema = new Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, trim: true },
  taxCodes:      [{ type: ObjectId, ref: 'TaxCode' }],
  totalRate:     { type: Number, default: 0 },
  applicableTo:  { type: String, enum: ['goods','services','both'], default: 'both' },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

taxGroupSchema.index({ isActive: 1 });

module.exports = mongoose.model('TaxGroup', taxGroupSchema);
