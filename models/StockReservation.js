const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const stockReservationSchema = new Schema({
  product:   { type: ObjectId, ref: 'Product', required: true },
  inventory: { type: ObjectId, ref: 'Inventory' },
  warehouse: { type: ObjectId, ref: 'Warehouse', required: true },

  quantity: { type: Number, required: true, min: 1 },

  referenceType: {
    type: String,
    enum: ['customer_order', 'dealer_order', 'transfer', 'manual'],
    required: true,
  },
  referenceId:     { type: ObjectId },
  referenceNumber: { type: String, trim: true },

  status: {
    type: String,
    enum: ['active', 'released', 'fulfilled', 'expired', 'cancelled'],
    default: 'active',
  },

  expiresAt:   { type: Date },
  fulfilledAt: { type: Date },
  releasedAt:  { type: Date },

  reservedBy:     { type: ObjectId },
  reservedByName: { type: String, trim: true },

  notes:     { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

stockReservationSchema.index({ product: 1, warehouse: 1, status: 1, isDeleted: 1 });
stockReservationSchema.index({ inventory: 1, status: 1, isDeleted: 1 });
stockReservationSchema.index({ referenceId: 1 });
stockReservationSchema.index({ status: 1, expiresAt: 1, isDeleted: 1 });
stockReservationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockReservation', stockReservationSchema);
