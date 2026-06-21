const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema({
  product:         { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:     { type: String, required: true },
  sku:             { type: String },
  quantityRequested: { type: Number, required: true, min: 1 },
  quantityShipped: { type: Number, default: 0 },
  quantityReceived:{ type: Number, default: 0 },
  unit:            { type: String, default: 'pcs' },
  batchNumber:     { type: String },
  sourceLocation:  { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  destLocation:    { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  status:          { type: String, enum: ['pending','shipped','received','discrepancy'], default: 'pending' },
  discrepancyNotes:{ type: String },
}, { _id: true });

const stockTransferSchema = new mongoose.Schema({
  transferNumber:  { type: String, unique: true },
  fromWarehouse:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  fromWarehouseName: { type: String },
  toWarehouse:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouseName: { type: String },
  items:           [transferItemSchema],
  reason:          { type: String },
  status: {
    type: String,
    enum: ['draft','submitted','approved','rejected','in_transit','received','completed','cancelled'],
    default: 'draft',
  },
  priority:        { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedByName: { type: String },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName:  { type: String },
  approvedAt:      { type: Date },
  shippedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  shippedAt:       { type: Date },
  receivedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  receivedAt:      { type: Date },
  completedAt:     { type: Date },
  vehicle:         { type: String },
  driverName:      { type: String },
  notes:           { type: String },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

stockTransferSchema.pre('save', async function (next) {
  if (!this.transferNumber) {
    const d   = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ds  = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const count = await mongoose.model('StockTransfer').countDocuments({ transferNumber: { $regex: `^TRF-${ds}` } });
    this.transferNumber = `TRF-${ds}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

stockTransferSchema.index({ status: 1, isDeleted: 1 });
stockTransferSchema.index({ fromWarehouse: 1, toWarehouse: 1 });
stockTransferSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
