const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const ADJUSTMENT_REASONS = ['damage', 'lost', 'expired', 'manual', 'correction', 'theft', 'sample', 'write_off'];

const adjustmentItemSchema = new Schema({
  product:         { type: ObjectId, ref: 'Product' },
  productName:     { type: String, trim: true },
  storageLocation: { type: ObjectId, ref: 'StorageLocation' },
  reason:          { type: String, enum: ADJUSTMENT_REASONS },
  currentQty:      { type: Number, default: 0 },
  adjustedQty:     { type: Number, default: 0 }, // delta: positive = add, negative = remove
  notes:           { type: String, trim: true },
}, { _id: true });

const stockAdjustmentSchema = new Schema({
  adjustmentNumber: { type: String, unique: true, trim: true },
  warehouse:        { type: ObjectId, ref: 'Warehouse', required: true },
  items:            [adjustmentItemSchema],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'applied'],
    default: 'pending',
  },

  requestedBy:      { type: ObjectId },
  requestedByName:  { type: String, trim: true },
  requestedByType:  { type: String, enum: ['admin', 'warehouse_user'], default: 'warehouse_user' },
  approvedBy:       { type: ObjectId },
  approvedByName:   { type: String, trim: true },
  approvedAt:       { type: Date },
  appliedAt:        { type: Date },
  rejectionReason:  { type: String, trim: true },

  notes:     { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

stockAdjustmentSchema.index({ warehouse: 1, status: 1, isDeleted: 1 });
stockAdjustmentSchema.index({ status: 1, isDeleted: 1 });
stockAdjustmentSchema.index({ createdAt: -1 });
stockAdjustmentSchema.index({ adjustmentNumber: 1 });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
