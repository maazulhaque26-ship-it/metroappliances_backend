'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionSettingsSchema = new Schema({
  oeeTarget:            { type: Number, default: 85 },
  scrapThreshold:       { type: Number, default: 5 },
  defaultShiftHours:    { type: Number, default: 8 },
  autoSchedule:         { type: Boolean, default: false },
  qualityCheckRequired: { type: Boolean, default: true },
  materialReservationMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  defaultWarehouse:     { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  updatedBy:            { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

productionSettingsSchema.statics.getSingleton = async function () {
  let s = await this.findOne();
  if (!s) s = await this.create({});
  return s;
};

module.exports = mongoose.model('ProductionSettings', productionSettingsSchema);
