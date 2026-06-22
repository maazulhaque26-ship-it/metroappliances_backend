'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const safetyStockRuleSchema = new Schema({
  material:      { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  materialName:  { type: String, default: '' },
  materialSKU:   { type: String, default: '' },
  warehouse:     { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  unit:          { type: String, default: 'pcs' },
  safetyStockQty:  { type: Number, required: true, min: 0 },
  reorderPoint:    { type: Number, required: true, min: 0 },
  reorderQty:      { type: Number, default: 0, min: 0 },
  maxStockQty:     { type: Number, default: 0, min: 0 },
  averageDailyUsage:  { type: Number, default: 0, min: 0 },
  leadTimeDays:       { type: Number, default: 0, min: 0 },
  demandVariability:  { type: Number, default: 0, min: 0, max: 100 },
  serviceLevel:       { type: Number, default: 95, min: 0, max: 100 },
  method:          { type: String, enum: ['fixed','dynamic','statistical'], default: 'fixed' },
  lastCalculated:  { type: Date },
  isActive:        { type: Boolean, default: true },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

safetyStockRuleSchema.index({ material: 1, isActive: 1 });
safetyStockRuleSchema.index({ warehouse: 1, isActive: 1 });

module.exports = mongoose.model('SafetyStockRule', safetyStockRuleSchema);
