const mongoose = require('mongoose');
const { dateStamp, nextSequence } = require('../utils/logisticsHelpers');

const dispatchItemSchema = new mongoose.Schema({
  product:         { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:     { type: String, required: true },
  sku:             { type: String },
  quantity:        { type: Number, required: true, min: 1 },
  quantityPicked:  { type: Number, default: 0 },
  quantityPacked:  { type: Number, default: 0 },
  unit:            { type: String, default: 'pcs' },
  batchNumber:     { type: String },
  serialNumbers:   [{ type: String }],
  storageLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  locationCode:    { type: String },
  pickStatus:      { type: String, enum: ['pending','picked','short_picked'], default: 'pending' },
  notes:           { type: String },
}, { _id: true });

const dispatchSchema = new mongoose.Schema({
  dispatchNumber:  { type: String, unique: true },
  // Source reference (one of these)
  orderRef:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  dealerOrderRef:  { type: mongoose.Schema.Types.ObjectId, ref: 'DealerOrder' },
  orderType:       { type: String, enum: ['customer','dealer','manual'], default: 'customer' },
  orderNumber:     { type: String },

  // Warehouse
  warehouse:       { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  warehouseName:   { type: String },

  // Recipient
  recipientName:   { type: String, required: true },
  recipientPhone:  { type: String },
  recipientEmail:  { type: String },
  deliveryAddress: {
    street:  { type: String },
    city:    { type: String },
    state:   { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
  },

  items:           [dispatchItemSchema],

  // Workflow status
  status: {
    type: String,
    enum: ['pending','assigned','picking','picked','packing','packed','ready','dispatched','in_transit','delivered','failed','returned','cancelled'],
    default: 'pending',
  },

  // Picking
  pickingList:     { type: mongoose.Schema.Types.ObjectId, ref: 'PickingList' },
  assignedPicker:  { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  pickerName:      { type: String },
  pickingStartedAt: { type: Date },
  pickingCompletedAt: { type: Date },

  // Packing
  package:         { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  assignedPacker:  { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  packingCompletedAt: { type: Date },

  // Shipment
  shipment:        { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  batch:           { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchBatch' },

  // Delivery Challan
  deliveryChallan: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryChallan' },

  // Admin
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName:   { type: String },
  notes:           { type: String },
  priority:        { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },

  dispatchedAt:    { type: Date },
  deliveredAt:     { type: Date },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

dispatchSchema.pre('save', async function (next) {
  if (!this.dispatchNumber) {
    const ds = dateStamp();
    const seq = await nextSequence(mongoose.connection, `dispatch:${ds}`);
    this.dispatchNumber = `DSP-${ds}-${String(seq).padStart(4, '0')}`;
  }
  next();
});

dispatchSchema.index({ status: 1, isDeleted: 1 });
dispatchSchema.index({ warehouse: 1, status: 1 });
dispatchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
