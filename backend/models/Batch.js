const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const batchSchema = new Schema({
  batchNumber:     { type: String, required: true, trim: true },
  product:         { type: ObjectId, ref: 'Product', required: true },
  warehouse:       { type: ObjectId, ref: 'Warehouse', required: true },
  zone:            { type: ObjectId, ref: 'WarehouseZone' },
  storageLocation: { type: ObjectId, ref: 'StorageLocation' },
  grn:             { type: ObjectId, ref: 'GRN' },

  supplier:         { type: String, trim: true },
  manufacturingDate:{ type: Date },
  expiryDate:       { type: Date },
  receivedDate:     { type: Date, default: Date.now },

  initialQty:   { type: Number, required: true, min: 0 },
  availableQty: { type: Number, default: 0, min: 0 },
  usedQty:      { type: Number, default: 0, min: 0 },
  damagedQty:   { type: Number, default: 0, min: 0 },

  costPerUnit: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['active', 'depleted', 'expired', 'quarantine'],
    default: 'active',
  },

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

batchSchema.index({ product: 1, warehouse: 1, isDeleted: 1 });
batchSchema.index({ warehouse: 1, status: 1, isDeleted: 1 });
batchSchema.index({ expiryDate: 1, isDeleted: 1 });
batchSchema.index({ grn: 1 });
batchSchema.index({ batchNumber: 1, product: 1, warehouse: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
