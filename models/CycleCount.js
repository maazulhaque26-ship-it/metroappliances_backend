const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const countItemSchema = new Schema({
  product:         { type: ObjectId, ref: 'Product' },
  productName:     { type: String, trim: true },
  storageLocation: { type: ObjectId, ref: 'StorageLocation' },
  expectedQty:     { type: Number, default: 0 },
  countedQty:      { type: Number, default: 0 },
  variance:        { type: Number, default: 0 }, // countedQty - expectedQty
  notes:           { type: String, trim: true },
}, { _id: true });

const cycleCountSchema = new Schema({
  countNumber: { type: String, unique: true, trim: true },
  warehouse:   { type: ObjectId, ref: 'Warehouse', required: true },
  zone:        { type: ObjectId, ref: 'WarehouseZone' },

  status: {
    type: String,
    enum: ['planned', 'started', 'completed', 'approved', 'cancelled'],
    default: 'planned',
  },

  scheduledDate: { type: Date },
  startedAt:     { type: Date },
  completedAt:   { type: Date },
  approvedAt:    { type: Date },

  items: [countItemSchema],

  conductedBy:     { type: ObjectId },
  conductedByName: { type: String, trim: true },
  conductedByType: { type: String, enum: ['admin', 'warehouse_user'], default: 'warehouse_user' },
  approvedBy:      { type: ObjectId },
  approvedByName:  { type: String, trim: true },

  totalExpected:      { type: Number, default: 0 },
  totalCounted:       { type: Number, default: 0 },
  totalVariance:      { type: Number, default: 0 },
  itemsWithVariance:  { type: Number, default: 0 },

  adjustmentGenerated: { type: Boolean, default: false },
  adjustment:          { type: ObjectId, ref: 'StockAdjustment' },

  notes:     { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

cycleCountSchema.index({ warehouse: 1, status: 1, isDeleted: 1 });
cycleCountSchema.index({ warehouse: 1, isDeleted: 1 });
cycleCountSchema.index({ status: 1, isDeleted: 1 });
cycleCountSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CycleCount', cycleCountSchema);
