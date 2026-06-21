const mongoose = require('mongoose');

const dispatchBatchSchema = new mongoose.Schema({
  batchNumber:     { type: String, unique: true },
  warehouse:       { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  warehouseName:   { type: String },
  dispatches:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' }],
  vehicle:         { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchVehicle' },
  vehicleInfo:     { type: String }, // denormalized
  driver:          { type: String },
  driverPhone:     { type: String },
  route:           { type: String },
  zone:            { type: String },
  status:          { type: String, enum: ['draft','ready','dispatched','in_transit','completed','cancelled'], default: 'draft' },
  scheduledDate:   { type: Date },
  dispatchedAt:    { type: Date },
  completedAt:     { type: Date },
  totalDispatches: { type: Number, default: 0 },
  delivered:       { type: Number, default: 0 },
  failed:          { type: Number, default: 0 },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:           { type: String },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

dispatchBatchSchema.pre('save', async function (next) {
  if (!this.batchNumber) {
    const d   = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ds  = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const count = await mongoose.model('DispatchBatch').countDocuments({ batchNumber: { $regex: `^BATCH-${ds}` } });
    this.batchNumber = `BATCH-${ds}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

dispatchBatchSchema.index({ status: 1, warehouse: 1 });

module.exports = mongoose.model('DispatchBatch', dispatchBatchSchema);
