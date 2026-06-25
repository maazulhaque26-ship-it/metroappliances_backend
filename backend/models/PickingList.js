const mongoose = require('mongoose');

const pickingItemSchema = new mongoose.Schema({
  dispatch:        { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
  dispatchNumber:  { type: String },
  product:         { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:     { type: String },
  sku:             { type: String },
  quantityRequired:{ type: Number, required: true },
  quantityPicked:  { type: Number, default: 0 },
  storageLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation' },
  locationCode:    { type: String },
  zone:            { type: String },
  status:          { type: String, enum: ['pending','picked','short_picked','skipped'], default: 'pending' },
  notes:           { type: String },
}, { _id: true });

const pickingListSchema = new mongoose.Schema({
  pickingNumber:   { type: String, unique: true },
  warehouse:       { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  warehouseName:   { type: String },
  assignedTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseUser' },
  assignedName:    { type: String },
  items:           [pickingItemSchema],
  dispatches:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' }],
  status:          { type: String, enum: ['pending','in_progress','completed','cancelled'], default: 'pending' },
  startedAt:       { type: Date },
  completedAt:     { type: Date },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:           { type: String },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

pickingListSchema.pre('save', async function (next) {
  if (!this.pickingNumber) {
    const d   = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ds  = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const count = await mongoose.model('PickingList').countDocuments({ pickingNumber: { $regex: `^PICK-${ds}` } });
    this.pickingNumber = `PICK-${ds}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

pickingListSchema.index({ status: 1, warehouse: 1 });
pickingListSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('PickingList', pickingListSchema);
