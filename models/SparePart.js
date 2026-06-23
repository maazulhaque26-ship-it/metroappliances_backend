const mongoose = require('mongoose');
const { Schema } = mongoose;

const consumptionLogSchema = new Schema({
  serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
  technicianId:     { type: Schema.Types.ObjectId, ref: 'Technician' },
  quantity:         { type: Number, required: true },
  usedAt:           { type: Date, default: Date.now },
  note:             { type: String },
}, { _id: true });

const sparePartSchema = new Schema({
  partNumber:     { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:           { type: String, required: true, trim: true },
  description:    { type: String },
  category:       { type: String, required: true },
  brand:          { type: String },

  compatibleProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  compatibleModels:   [{ type: String }],

  warehouseLocation: {
    warehouseId:  { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    locationCode: { type: String },
    binCode:      { type: String },
  },

  quantity:     { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 5 },
  unitPrice:    { type: Number, required: true, min: 0 },
  taxPercent:   { type: Number, default: 18 },

  images:       [{ type: String }],
  hsn:          { type: String },

  consumptionLogs: [consumptionLogSchema],

  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

sparePartSchema.index({ category: 1, isActive: 1 });
sparePartSchema.index({ compatibleProducts: 1 });
sparePartSchema.index({ quantity: 1, reorderLevel: 1 });

module.exports = mongoose.model('SparePart', sparePartSchema);
