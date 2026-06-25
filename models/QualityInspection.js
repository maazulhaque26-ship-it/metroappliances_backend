'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const qualityInspectionSchema = new Schema({
  inspectionNumber: { type: String, unique: true },
  workOrder:        { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  productionExecution: { type: Schema.Types.ObjectId, ref: 'ProductionExecution' },
  product:          { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:      { type: String, default: '' },
  factory:          { type: Schema.Types.ObjectId, ref: 'Factory' },
  inspectionType:   { type: String, enum: ['incoming','in_process','final'], required: true },
  inspectedQty:     { type: Number, required: true, min: 0.001 },
  passedQty:        { type: Number, default: 0, min: 0 },
  failedQty:        { type: Number, default: 0, min: 0 },
  conditionalQty:   { type: Number, default: 0, min: 0 },
  passRate:         { type: Number, default: 0, min: 0, max: 100 },
  firstPassYield:   { type: Number, default: 0, min: 0, max: 100 },
  inspector:        { type: Schema.Types.ObjectId, ref: 'User' },
  inspectorName:    { type: String, default: '' },
  inspectionDate:   { type: Date, default: Date.now },
  result:           { type: String, enum: ['pass','fail','conditional','pending'], default: 'pending' },
  remarks:          { type: String, default: '' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

qualityInspectionSchema.index({ workOrder: 1, inspectionType: 1 });
qualityInspectionSchema.index({ factory: 1, result: 1 });
qualityInspectionSchema.index({ inspectionDate: -1 });

qualityInspectionSchema.pre('validate', async function (next) {
  if (this.isNew && !this.inspectionNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('QualityInspection').countDocuments();
    this.inspectionNumber = `QI-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('QualityInspection', qualityInspectionSchema);
