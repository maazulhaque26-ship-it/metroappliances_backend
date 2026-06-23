'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const eInvoiceSchema = new Schema({
  eInvoiceNumber:  { type: String, unique: true },
  irn:             { type: String, unique: true, sparse: true, trim: true },   // Invoice Reference Number (64-char hash)
  qrCode:          { type: String, trim: true },
  signedInvoice:   { type: String, trim: true },
  ackNo:           { type: String, trim: true },
  ackDate:         { type: Date },
  customerInvoice: { type: ObjectId, ref: 'CustomerInvoice' },
  gstInvoice:      { type: ObjectId, ref: 'GSTInvoice' },
  invoiceNumber:   { type: String, trim: true },
  invoiceDate:     { type: Date },
  invoiceType:     { type: String, enum: ['INV','CRN','DBN'], default: 'INV' },
  sellerGSTIN:     { type: String, required: true, trim: true },
  buyerGSTIN:      { type: String, trim: true },
  buyerName:       { type: String, trim: true },
  totalValue:      { type: Number, default: 0 },
  igstAmount:      { type: Number, default: 0 },
  cgstAmount:      { type: Number, default: 0 },
  sgstAmount:      { type: Number, default: 0 },
  cessAmount:      { type: Number, default: 0 },
  taxableValue:    { type: Number, default: 0 },
  supplyType:      { type: String, enum: ['B2B','B2C','SEZWP','SEZWOP','EXPWP','EXPWOP','DEXP'], default: 'B2B' },
  reverseCharge:   { type: String, enum: ['Y','N'], default: 'N' },
  irnStatus:       { type: String, enum: ['pending','generated','cancelled','error'], default: 'pending' },
  cancellationDate:{ type: Date },
  cancellationReason: { type: String, trim: true },
  jsonPayload:     { type: Schema.Types.Mixed },   // full IRP JSON payload
  errorMessage:    { type: String, trim: true },
  generatedBy:     { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

eInvoiceSchema.index({ irnStatus: 1 });
eInvoiceSchema.index({ sellerGSTIN: 1, invoiceDate: -1 });
eInvoiceSchema.index({ customerInvoice: 1 });

eInvoiceSchema.pre('validate', async function (next) {
  if (!this.eInvoiceNumber) {
    const yr = new Date().getFullYear();
    const prefix = `EINV-${yr}-`;
    const count = await this.constructor.countDocuments({ eInvoiceNumber: { $regex: `^${prefix}` } });
    this.eInvoiceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('EInvoice', eInvoiceSchema);
