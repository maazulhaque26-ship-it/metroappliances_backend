const mongoose = require('mongoose');
const { dateStamp, nextSequence } = require('../utils/logisticsHelpers');

const trackingEventSchema = new mongoose.Schema({
  status:      { type: String, required: true },
  location:    { type: String },
  description: { type: String },
  timestamp:   { type: Date, default: Date.now },
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  shipmentNumber:     { type: String, unique: true },
  dispatch:           { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
  package:            { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  warehouse:          { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

  // Courier
  courier:            { type: mongoose.Schema.Types.ObjectId, ref: 'Courier' },
  courierName:        { type: String },
  courierCode:        { type: String },
  serviceLevel:       { type: String, default: 'standard' }, // standard, express, overnight
  trackingNumber:     { type: String },
  trackingUrl:        { type: String },

  // Lifecycle status
  status: {
    type: String,
    enum: ['created','packed','ready','dispatched','in_transit','out_for_delivery','delivered','failed','returned','cancelled'],
    default: 'created',
  },

  // Dates
  dispatchedAt:       { type: Date },
  estimatedDelivery:  { type: Date },
  deliveredAt:        { type: Date },
  returnedAt:         { type: Date },

  // Recipient (denormalized from dispatch)
  recipientName:      { type: String },
  recipientPhone:     { type: String },
  deliveryAddress:    {
    street:  { type: String },
    city:    { type: String },
    state:   { type: String },
    pincode: { type: String },
    country: { type: String },
  },

  // Proof of delivery
  podSignature:       { type: String }, // URL or base64
  podImage:           { type: String }, // URL
  podReceivedBy:      { type: String },
  podNotes:           { type: String },

  // Tracking events
  trackingEvents:     [trackingEventSchema],

  // Failure/return
  failureReason:      { type: String },
  returnReason:       { type: String },
  attempts:           { type: Number, default: 0 },

  // Weight/dimensions (from package)
  weight:             { type: Number },
  freightCharge:      { type: Number, default: 0 },

  createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:              { type: String },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

shipmentSchema.pre('save', async function (next) {
  if (!this.shipmentNumber) {
    const ds = dateStamp();
    const seq = await nextSequence(mongoose.connection, `shipment:${ds}`);
    this.shipmentNumber = `SHP-${ds}-${String(seq).padStart(4, '0')}`;
  }
  next();
});

shipmentSchema.index({ status: 1, isDeleted: 1 });
shipmentSchema.index({ courier: 1, status: 1 });
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
