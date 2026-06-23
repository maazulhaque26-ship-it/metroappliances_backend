'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const inspectionLotSchema = new Schema({
  lotNumber:       { type: String, unique: true },
  inspectionPlan:  { type: Schema.Types.ObjectId, ref: 'InspectionPlan' },
  product:         { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:     { type: String, default: '' },
  productSKU:      { type: String, default: '' },
  vendor:          { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName:      { type: String, default: '' },
  purchaseOrder:   { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  workOrder:       { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  factory:         { type: Schema.Types.ObjectId, ref: 'Factory' },
  inspectionType:  { type: String, enum: ['incoming','in_process','final','audit','customer'], default: 'incoming' },
  source:          { type: String, enum: ['purchase','production','customer_return','transfer','other'], default: 'purchase' },
  lotSize:         { type: Number, required: true, min: 1 },
  sampleSize:      { type: Number, default: 0, min: 0 },
  aqlLevel:        { type: String, default: '1.0' },
  passQty:         { type: Number, default: 0, min: 0 },
  failQty:         { type: Number, default: 0, min: 0 },
  pendingQty:      { type: Number, default: 0, min: 0 },
  status:          { type: String, enum: ['pending','in_progress','passed','failed','conditional','cancelled'], default: 'pending' },
  startedAt:       { type: Date },
  completedAt:     { type: Date },
  inspectedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  inspectedByName: { type: String, default: '' },
  disposition:     { type: String, enum: ['accept','reject','conditional_accept','pending'], default: 'pending' },
  dispositionBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  dispositionNotes:{ type: String, default: '' },
  batchNumber:     { type: String, default: '' },
  expiryDate:      { type: Date },
  notes:           { type: String, default: '' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

inspectionLotSchema.index({ product: 1, status: 1 });
inspectionLotSchema.index({ vendor: 1, inspectionType: 1 });
inspectionLotSchema.index({ purchaseOrder: 1 });
inspectionLotSchema.index({ workOrder: 1 });
inspectionLotSchema.index({ status: 1, createdAt: -1 });

inspectionLotSchema.pre('validate', async function (next) {
  if (this.isNew && !this.lotNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('InspectionLot').countDocuments();
    this.lotNumber = `IL-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('InspectionLot', inspectionLotSchema);
