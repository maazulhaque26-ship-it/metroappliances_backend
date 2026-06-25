'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const mrpRecommendationSchema = new Schema({
  recommendationNumber: { type: String, unique: true },
  mrpRun:       { type: Schema.Types.ObjectId, ref: 'MRPRun', required: true },
  type:         { type: String, enum: ['purchase','production','transfer','expedite','cancel','reschedule'], required: true },
  material:     { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  materialName: { type: String, default: '' },
  materialSKU:  { type: String, default: '' },
  quantity:     { type: Number, required: true, min: 0.001 },
  unit:         { type: String, default: 'pcs' },
  suggestedDate:{ type: Date },
  dueDate:      { type: Date },
  priority:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  estimatedCost:{ type: Number, default: 0, min: 0 },
  vendor:       { type: Schema.Types.ObjectId, ref: 'Vendor' },
  factory:      { type: Schema.Types.ObjectId, ref: 'Factory' },
  sourceWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  targetWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  shortage:     { type: Schema.Types.ObjectId, ref: 'MaterialShortage' },
  status:       { type: String, enum: ['open','accepted','rejected','actioned'], default: 'open' },
  rejectionReason: { type: String, default: '' },
  notes:        { type: String, default: '' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

mrpRecommendationSchema.index({ mrpRun: 1, type: 1 });
mrpRecommendationSchema.index({ mrpRun: 1, status: 1 });
mrpRecommendationSchema.index({ material: 1, suggestedDate: 1 });

mrpRecommendationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.recommendationNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MRPRecommendation').countDocuments();
    this.recommendationNumber = `MRPREC-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MRPRecommendation', mrpRecommendationSchema);
