const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const grnItemSchema = new Schema({
  product:         { type: ObjectId, ref: 'Product' },
  productName:     { type: String, trim: true },
  sku:             { type: String, trim: true },
  orderedQty:      { type: Number, default: 0 },
  receivedQty:     { type: Number, default: 0 },
  acceptedQty:     { type: Number, default: 0 },
  rejectedQty:     { type: Number, default: 0 },
  damageQty:       { type: Number, default: 0 },
  unitCost:        { type: Number, default: 0 },
  zone:            { type: ObjectId, ref: 'WarehouseZone' },
  storageLocation: { type: ObjectId, ref: 'StorageLocation' },
  batchNumber:     { type: String, trim: true },
  expiryDate:      { type: Date },
  manufacturingDate:{ type: Date },
  remarks:         { type: String, trim: true },
}, { _id: true });

const grnSchema = new Schema({
  grnNumber:       { type: String, unique: true, trim: true },
  warehouse:       { type: ObjectId, ref: 'Warehouse', required: true },
  supplier:        { type: String, trim: true },
  supplierPhone:   { type: String, trim: true },
  supplierInvoice: { type: String, trim: true },
  purchaseOrder:   { type: String, trim: true },
  status: {
    type: String,
    enum: ['draft', 'pending', 'receiving', 'quality_check', 'completed', 'cancelled'],
    default: 'draft',
  },
  items:          [grnItemSchema],
  totalItems:     { type: Number, default: 0 },
  totalAccepted:  { type: Number, default: 0 },
  totalRejected:  { type: Number, default: 0 },
  totalDamaged:   { type: Number, default: 0 },
  totalValue:     { type: Number, default: 0 },
  receivedBy:     { type: ObjectId, ref: 'WarehouseUser' },
  receivedByName: { type: String, trim: true },
  verifiedBy:     { type: ObjectId, ref: 'WarehouseUser' },
  verifiedByName: { type: String, trim: true },
  createdBy:      { type: ObjectId },
  createdByName:  { type: String, trim: true },
  receivedAt:     { type: Date },
  completedAt:    { type: Date },
  remarks:        { type: String, trim: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

grnSchema.index({ warehouse: 1, isDeleted: 1 });
grnSchema.index({ status: 1, isDeleted: 1 });
grnSchema.index({ createdAt: -1 });
grnSchema.index({ grnNumber: 1 });
grnSchema.index({ warehouse: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('GRN', grnSchema);
