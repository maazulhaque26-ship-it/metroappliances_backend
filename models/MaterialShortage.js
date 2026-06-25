'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const materialShortageSchema = new Schema({
  mrpRun:           { type: Schema.Types.ObjectId, ref: 'MRPRun', required: true },
  materialRequirement: { type: Schema.Types.ObjectId, ref: 'MaterialRequirement' },
  material:         { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  materialName:     { type: String, default: '' },
  materialSKU:      { type: String, default: '' },
  unit:             { type: String, default: 'pcs' },
  shortageQty:      { type: Number, required: true, min: 0.001 },
  requiredDate:     { type: Date },
  severity:         { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  impactedOrders:   [{ type: Schema.Types.ObjectId, ref: 'ProductionOrder' }],
  impactedPlans:    [{ type: Schema.Types.ObjectId, ref: 'ProductionPlan' }],
  recommendation:   { type: Schema.Types.ObjectId, ref: 'MRPRecommendation' },
  status:           { type: String, enum: ['open','in_progress','resolved','ignored'], default: 'open' },
  resolvedAt:       { type: Date },
  resolvedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedByName:   { type: String, default: '' },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

materialShortageSchema.index({ mrpRun: 1, severity: 1 });
materialShortageSchema.index({ mrpRun: 1, status: 1 });
materialShortageSchema.index({ material: 1, requiredDate: 1 });
materialShortageSchema.index({ status: 1, severity: 1 });

module.exports = mongoose.model('MaterialShortage', materialShortageSchema);
