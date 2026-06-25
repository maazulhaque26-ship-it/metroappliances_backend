'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const workOrderSchema = new Schema({
  orderNumber:      { type: String, unique: true },
  productionOrder:  { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  product:          { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:      { type: String, default: '' },
  productSKU:       { type: String, default: '' },
  factory:          { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  workCenter:       { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  shift:            { type: Schema.Types.ObjectId, ref: 'Shift' },
  plannedQty:       { type: Number, required: true, min: 0.001 },
  completedQty:     { type: Number, default: 0, min: 0 },
  scrapQty:         { type: Number, default: 0, min: 0 },
  reworkQty:        { type: Number, default: 0, min: 0 },
  unit:             { type: String, default: 'pcs' },
  status:           { type: String, enum: ['draft','released','started','paused','completed','cancelled'], default: 'draft' },
  priority:         { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  plannedStartDate: { type: Date },
  plannedEndDate:   { type: Date },
  actualStartDate:  { type: Date },
  actualEndDate:    { type: Date },
  estimatedDurationMins: { type: Number, default: 0 },
  actualDurationMins:    { type: Number, default: 0 },
  yieldPct:         { type: Number, default: 0, min: 0, max: 100 },
  oeeScore:         { type: Number, default: 0, min: 0, max: 100 },
  releasedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  releasedByName:   { type: String, default: '' },
  completedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  completedByName:  { type: String, default: '' },
  notes:            { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

workOrderSchema.index({ factory: 1, status: 1 });
workOrderSchema.index({ productionOrder: 1 });
workOrderSchema.index({ product: 1, plannedStartDate: 1 });
workOrderSchema.index({ status: 1, priority: -1 });

workOrderSchema.virtual('completionRate').get(function () {
  return this.plannedQty > 0 ? Math.round((this.completedQty / this.plannedQty) * 100) : 0;
});

workOrderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('WorkOrder').countDocuments();
    this.orderNumber = `WO-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);
