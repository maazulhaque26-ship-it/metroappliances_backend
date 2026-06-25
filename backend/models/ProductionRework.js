'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionReworkSchema = new Schema({
  reworkNumber:  { type: String, unique: true },
  workOrder:     { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  product:       { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:   { type: String, default: '' },
  factory:       { type: Schema.Types.ObjectId, ref: 'Factory' },
  workCenter:    { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
  quantity:      { type: Number, required: true, min: 0.001 },
  unit:          { type: String, default: 'pcs' },
  reason:        { type: String, default: '' },
  reworkType:    { type: String, enum: ['repair','reprocess','adjustment','reinspection','other'], default: 'repair' },
  estimatedCost: { type: Number, default: 0, min: 0 },
  actualCost:    { type: Number, default: 0, min: 0 },
  estimatedDurationMins: { type: Number, default: 0, min: 0 },
  actualDurationMins:    { type: Number, default: 0, min: 0 },
  startDate:     { type: Date },
  endDate:       { type: Date },
  assignedTo:    { type: Schema.Types.ObjectId, ref: 'User' },
  assignedToName:{ type: String, default: '' },
  status:        { type: String, enum: ['pending','in_progress','completed','failed','scrapped'], default: 'pending' },
  result:        { type: String, enum: ['pass','fail','partial','pending'], default: 'pending' },
  notes:         { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

productionReworkSchema.index({ workOrder: 1, status: 1 });
productionReworkSchema.index({ factory: 1, status: 1 });

productionReworkSchema.pre('validate', async function (next) {
  if (this.isNew && !this.reworkNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('ProductionRework').countDocuments();
    this.reworkNumber = `RWK-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductionRework', productionReworkSchema);
