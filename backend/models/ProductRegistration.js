'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const transferSchema = new Schema({
  fromCustomer: { type: Schema.Types.ObjectId, ref: 'User' },
  toCustomer:   { type: Schema.Types.ObjectId, ref: 'User' },
  transferredAt: { type: Date, default: Date.now },
  note:          { type: String },
}, { _id: true });

const productRegistrationSchema = new Schema({
  registrationNumber: { type: String, unique: true },

  customer:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product:      { type: Schema.Types.ObjectId, ref: 'Product' },
  productName:  { type: String, required: true },
  brand:        { type: String },
  modelNumber:  { type: String, required: true },
  serialNumber: { type: String, required: true, trim: true, uppercase: true },
  purchaseDate: { type: Date, required: true },
  purchaseAmount: { type: Number },
  dealerName:   { type: String },
  dealerId:     { type: Schema.Types.ObjectId, ref: 'Dealer' },
  invoiceNumber: { type: String },
  invoiceUrl:   { type: String },
  barcodeValue: { type: String },
  qrCode:       { type: String },

  status: {
    type: String,
    enum: ['pending', 'verified', 'warranty_activated', 'invalid', 'transferred'],
    default: 'pending',
  },

  warranty: {
    activatedAt: { type: Date },
    warrantyId:  { type: Schema.Types.ObjectId, ref: 'WarrantyCard' },
    duration:    { type: Number },
  },

  transferHistory: [transferSchema],
  verifiedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt:   { type: Date },
  notes:        { type: String },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

productRegistrationSchema.pre('save', async function (next) {
  if (this.registrationNumber) return next();
  const year   = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const last   = await this.constructor.findOne(
    { registrationNumber: { $regex: `^${prefix}` } },
    {},
    { sort: { registrationNumber: -1 } }
  );
  const seq = last ? parseInt(last.registrationNumber.split('-')[2]) + 1 : 1;
  this.registrationNumber = `${prefix}${String(seq).padStart(5, '0')}`;
  next();
});

productRegistrationSchema.index({ customer: 1, isDeleted: 1 });
productRegistrationSchema.index({ serialNumber: 1 });
productRegistrationSchema.index({ status: 1 });

module.exports = mongoose.model('ProductRegistration', productRegistrationSchema);
