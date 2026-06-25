const mongoose = require('mongoose');

const replenishmentTaskSchema = new mongoose.Schema({
  productId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku:              { type: String, required: true },
  productName:      String,
  warehouseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  currentStock:     { type: Number, default: 0 },
  safetyStock:      { type: Number, default: 0 },
  minLevel:         { type: Number, default: 0 },
  maxLevel:         { type: Number, default: 0 },
  recommendedQty:   { type: Number, required: true },
  triggerType:      { type: String, enum: ['auto_low_stock', 'auto_velocity', 'auto_min_max', 'manual', 'scheduled'], default: 'auto_low_stock' },
  triggerReason:    String,
  priority:         { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  status:           { type: String, enum: ['pending', 'approved', 'ordered', 'received', 'cancelled'], default: 'pending' },
  linkedPOId:       { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  salesVelocity:    Number,
  pendingPOQty:     { type: Number, default: 0 },
  incomingGRNQty:   { type: Number, default: 0 },
  netShortfall:     Number,
  dueDate:          Date,
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:       Date,
  notes:            String,
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

replenishmentTaskSchema.index({ warehouseId: 1, status: 1 });
replenishmentTaskSchema.index({ sku: 1, warehouseId: 1 });
replenishmentTaskSchema.index({ priority: 1, status: 1 });
replenishmentTaskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('ReplenishmentTask', replenishmentTaskSchema);
