const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const serialNumberSchema = new Schema({
  serialNumber:    { type: String, required: true, unique: true, trim: true },
  product:         { type: ObjectId, ref: 'Product', required: true },
  warehouse:       { type: ObjectId, ref: 'Warehouse' },
  zone:            { type: ObjectId, ref: 'WarehouseZone' },
  storageLocation: { type: ObjectId, ref: 'StorageLocation' },
  grn:             { type: ObjectId, ref: 'GRN' },
  batch:           { type: ObjectId, ref: 'Batch' },

  status: {
    type: String,
    enum: ['in_stock', 'reserved', 'sold', 'returned', 'damaged', 'lost'],
    default: 'in_stock',
  },

  soldTo:       { type: String, trim: true },
  soldAt:       { type: Date },
  reservedFor:  { type: String, trim: true },
  reservedAt:   { type: Date },

  imei:           { type: String, trim: true },
  warrantyExpiry: { type: Date },
  notes:          { type: String, trim: true },

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

serialNumberSchema.index({ product: 1, isDeleted: 1 });
serialNumberSchema.index({ warehouse: 1, status: 1, isDeleted: 1 });
serialNumberSchema.index({ status: 1, isDeleted: 1 });
serialNumberSchema.index({ grn: 1 });
serialNumberSchema.index({ batch: 1 });
serialNumberSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SerialNumber', serialNumberSchema);
