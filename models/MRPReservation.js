'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const mrpReservationSchema = new Schema({
  reservationNumber: { type: String, unique: true },
  mrpRun:            { type: Schema.Types.ObjectId, ref: 'MRPRun', required: true },
  materialRequirement: { type: Schema.Types.ObjectId, ref: 'MaterialRequirement' },
  material:          { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  materialName:      { type: String, default: '' },
  warehouse:         { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  inventory:         { type: Schema.Types.ObjectId, ref: 'Inventory' },
  quantity:          { type: Number, required: true, min: 0.001 },
  unit:              { type: String, default: 'pcs' },
  reservedDate:      { type: Date, default: Date.now },
  expiryDate:        { type: Date },
  requiredDate:      { type: Date },
  status:            { type: String, enum: ['active','released','consumed','expired','cancelled'], default: 'active' },
  productionOrder:   { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  notes:             { type: String, default: '' },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

mrpReservationSchema.index({ mrpRun: 1, status: 1 });
mrpReservationSchema.index({ material: 1, status: 1 });
mrpReservationSchema.index({ materialRequirement: 1 });

mrpReservationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.reservationNumber) {
    const yr = new Date().getFullYear();
    const count = await mongoose.model('MRPReservation').countDocuments();
    this.reservationNumber = `MRPRES-${yr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MRPReservation', mrpReservationSchema);
