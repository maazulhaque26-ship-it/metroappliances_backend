'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const taxRuleSchema = new Schema({
  ruleName:      { type: String, required: true, trim: true },
  ruleCode:      { type: String, required: true, unique: true, trim: true },
  taxType:       { type: String, enum: ['GST','TDS','TCS','both'], required: true },
  applicableTo:  { type: String, enum: ['purchase','sale','both'], default: 'both' },
  taxCode:       { type: ObjectId, ref: 'TaxCode' },
  taxRate:       { type: ObjectId, ref: 'TaxRate' },
  taxGroup:      { type: ObjectId, ref: 'TaxGroup' },
  conditions:    { type: Schema.Types.Mixed },  // flexible condition object
  priority:      { type: Number, default: 0 },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo:   { type: Date },
  description:   { type: String, trim: true },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

taxRuleSchema.index({ taxType: 1, isActive: 1 });
taxRuleSchema.index({ priority: -1 });

module.exports = mongoose.model('TaxRule', taxRuleSchema);
