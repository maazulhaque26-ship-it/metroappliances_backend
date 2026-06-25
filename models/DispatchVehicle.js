const mongoose = require('mongoose');

const dispatchVehicleSchema = new mongoose.Schema({
  vehicleNumber:   { type: String, required: true, uppercase: true, trim: true },
  vehicleType:     { type: String, enum: ['bike','auto','van','truck','mini_truck'], default: 'van' },
  model:           { type: String },
  capacity:        { type: Number }, // kg
  driver:          { type: String },
  driverPhone:     { type: String },
  warehouse:       { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  status:          { type: String, enum: ['available','in_use','maintenance','inactive'], default: 'available' },
  lastServiceDate: { type: Date },
  notes:           { type: String },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

dispatchVehicleSchema.index({ status: 1, warehouse: 1 });

module.exports = mongoose.model('DispatchVehicle', dispatchVehicleSchema);
