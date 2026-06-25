'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionScrapSchema = new Schema({
  scrapNumber:   { type: String, unique: true },
  workOrder:     { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  product:       { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:   { type: String, default: '' },
  factory:       { type: Schema.Types.ObjectId, ref: 'Factory' },
  workCenter:    { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  quantity:      { type: Number, required: true, min: 0.001 },
  unit:          { type: String, default: 'pcs' },
  reason:        { type: String, enum: ['defective','dimensional','surface','material','process','operator_error','machine_fault','other'], default: 'other' },
  category:      { type: String, enum: ['material','component','finished_good'], default: 'component' },
  scrapValue:    { type: Number, default: 0, min: 0 },
  disposition:   { type: String, enum: ['recycled','disposed','sold','pending'], default: 'pending' },
  reportedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  reportedByName:{ type: String, default: '' },
  approvedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName:{ type: String, default: '' },
  approvedAt:    { type: Date },
  status:        { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

productionScrapSchema.index({ workOrder: 1 });
productionScrapSchema.index({ factory: 1, status: 1 });
productionScrapSchema.index({ createdAt: -1 });

productionScrapSchema.pre('validate', async function (next) {
  if (this.isNew && !this.scrapNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ProductionScrap').countDocuments();
    this.scrapNumber = `SCR-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductionScrap', productionScrapSchema);
