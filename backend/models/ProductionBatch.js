'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const qualityCheckSchema = new Schema({
  parameter:  { type: String, required: true },
  value:      { type: String, default: '' },
  passed:     { type: Boolean, default: true },
  checkedBy:  { type: String, default: '' },
  checkedAt:  { type: Date, default: Date.now },
}, { _id: true });

const productionBatchSchema = new Schema({
  batchNumber:     { type: String, unique: true },
  productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
  product:         { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  machine:         { type: Schema.Types.ObjectId, ref: 'Machine' },
  batchSize:       { type: Number, required: true, min: 1 },
  completedQty:    { type: Number, default: 0, min: 0 },
  rejectedQty:     { type: Number, default: 0, min: 0 },
  status:          { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
  startedAt:       { type: Date },
  completedAt:     { type: Date },
  qualityChecks:   [qualityCheckSchema],
  scrapRate:       { type: Number, default: 0, min: 0, max: 100 },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

productionBatchSchema.index({ productionOrder: 1, isDeleted: 1 });
productionBatchSchema.index({ product: 1 });
productionBatchSchema.index({ status: 1 });

productionBatchSchema.pre('save', async function (next) {
  if (this.isNew && !this.batchNumber) {
    const year  = new Date().getFullYear();
    const count = await mongoose.model('ProductionBatch').countDocuments();
    this.batchNumber = `BTH-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  if (this.completedQty > 0 || this.rejectedQty > 0) {
    const total = this.completedQty + this.rejectedQty;
    this.scrapRate = total > 0 ? Number(((this.rejectedQty / total) * 100).toFixed(2)) : 0;
  }
  next();
});

module.exports = mongoose.model('ProductionBatch', productionBatchSchema);
