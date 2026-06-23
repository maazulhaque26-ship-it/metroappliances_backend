'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const gstRegistrationSchema = new Schema({
  gstin:           { type: String, required: true, unique: true, trim: true, uppercase: true },
  legalName:       { type: String, required: true, trim: true },
  tradeName:       { type: String, trim: true },
  registrationType:{ type: String, enum: ['regular','composition','casual','nonResident','ISD','TDS','TCS','SEZ','government'], default: 'regular' },
  state:           { type: String, required: true, trim: true },
  stateCode:       { type: String, required: true, trim: true },
  address:         { type: String, trim: true },
  registrationDate:{ type: Date },
  cancellationDate:{ type: Date },
  panNumber:       { type: String, trim: true, uppercase: true },
  status:          { type: String, enum: ['active','suspended','cancelled','pending'], default: 'active' },
  isDefault:       { type: Boolean, default: false },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

gstRegistrationSchema.index({ state: 1 });
gstRegistrationSchema.index({ status: 1 });

module.exports = mongoose.model('GSTRegistration', gstRegistrationSchema);
