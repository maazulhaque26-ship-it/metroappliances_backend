'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const bomItemSchema = new Schema({
  bom:             { type: Schema.Types.ObjectId, ref: 'BillOfMaterials', required: true },
  rawMaterial:     { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  rawMaterialName: { type: String, required: true, trim: true },
  rawMaterialSKU:  { type: String, default: '' },
  quantity:        { type: Number, required: true, min: 0.001 },
  unit:            { type: String, required: true, trim: true, default: 'pcs' },
  wasteAllowance:  { type: Number, default: 0, min: 0, max: 100 },
  unitCost:        { type: Number, default: 0, min: 0 },
  sequence:        { type: Number, default: 0 },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

bomItemSchema.index({ bom: 1, isDeleted: 1 });
bomItemSchema.index({ rawMaterial: 1 });

module.exports = mongoose.model('BOMItem', bomItemSchema);
