'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionLineSchema = new Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:        { type: String, required: true, trim: true },
  factory:     { type: Schema.Types.ObjectId, ref: 'Factory', required: true },
  workCenters: [{ type: Schema.Types.ObjectId, ref: 'WorkCenter' }],
  product:     { type: Schema.Types.ObjectId, ref: 'Product' },
  targetOutputPerShift: { type: Number, default: 0 },
  status:    { type: String, enum: ['running', 'idle', 'maintenance', 'setup'], default: 'idle' },
  notes:     { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

productionLineSchema.index({ factory: 1, isDeleted: 1 });
productionLineSchema.index({ status: 1 });

module.exports = mongoose.model('ProductionLine', productionLineSchema);
