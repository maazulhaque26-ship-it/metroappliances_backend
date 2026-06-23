'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const inspectionPlanSchema = new Schema({
  planNumber:      { type: String, unique: true },
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  product:         { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:     { type: String, default: '' },
  productCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
  vendor:          { type: Schema.Types.ObjectId, ref: 'Vendor' },
  inspectionType:  { type: String, enum: ['incoming','in_process','final','audit','customer'], default: 'incoming' },
  samplingMethod:  { type: String, enum: ['100_percent','sampling','skip_lot','none'], default: 'sampling' },
  sampleSize:      { type: Number, default: 0, min: 0 },
  samplePct:       { type: Number, default: 0, min: 0, max: 100 },
  aqlLevel:        { type: String, enum: ['0.065','0.1','0.15','0.25','0.4','0.65','1.0','1.5','2.5','4.0','6.5','none'], default: '1.0' },
  inspectionLevel: { type: String, enum: ['I','II','III'], default: 'II' },
  frequency:       { type: String, enum: ['every_lot','periodic','first_article','skip'], default: 'every_lot' },
  status:          { type: String, enum: ['draft','active','inactive','obsolete'], default: 'draft' },
  effectiveFrom:   { type: Date },
  effectiveTo:     { type: Date },
  revision:        { type: String, default: 'A' },
  approvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:  { type: String, default: '' },
  approvedAt:      { type: Date },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

inspectionPlanSchema.index({ product: 1, inspectionType: 1, status: 1 });
inspectionPlanSchema.index({ vendor: 1, status: 1 });
inspectionPlanSchema.index({ status: 1 });

inspectionPlanSchema.pre('validate', async function (next) {
  if (this.isNew && !this.planNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('InspectionPlan').countDocuments();
    this.planNumber = `IP-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('InspectionPlan', inspectionPlanSchema);
