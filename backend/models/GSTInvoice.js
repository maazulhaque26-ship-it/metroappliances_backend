'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const gstInvoiceLineSchema = new Schema({
  description:  { type: String },
  hsnSacCode:   { type: String },
  quantity:     { type: Number, default: 1 },
  unitPrice:    { type: Number, default: 0 },
  taxableValue: { type: Number, default: 0 },
  igstRate:     { type: Number, default: 0 },
  cgstRate:     { type: Number, default: 0 },
  sgstRate:     { type: Number, default: 0 },
  cessRate:     { type: Number, default: 0 },
  igstAmount:   { type: Number, default: 0 },
  cgstAmount:   { type: Number, default: 0 },
  sgstAmount:   { type: Number, default: 0 },
  cessAmount:   { type: Number, default: 0 },
  totalTax:     { type: Number, default: 0 },
  lineTotal:    { type: Number, default: 0 },
}, { _id: false });

const gstInvoiceSchema = new Schema({
  gstInvoiceNumber: { type: String, unique: true },
  invoiceType:    { type: String, enum: ['B2B','B2C_large','B2C_small','export','import','SEZ','nil_rated','exempt','reverse_charge'], required: true },
  sourceType:     { type: String, enum: ['customer_invoice','vendor_bill','dealer_invoice','manual'], default: 'customer_invoice' },
  sourceId:       { type: ObjectId },
  sourceNumber:   { type: String },
  customerInvoice:{ type: ObjectId, ref: 'CustomerInvoice' },
  vendorBill:     { type: ObjectId, ref: 'VendorBill' },
  gstin:          { type: String, trim: true },
  partyName:      { type: String, required: true, trim: true },
  partyGSTIN:     { type: String, trim: true },
  partyState:     { type: String, trim: true },
  partyStateCode: { type: String, trim: true },
  invoiceDate:    { type: Date, required: true, default: Date.now },
  supplyType:     { type: String, enum: ['intra','inter','import','export'], default: 'intra' },
  placeOfSupply:  { type: String, trim: true },
  taxableValue:   { type: Number, default: 0 },
  igstAmount:     { type: Number, default: 0 },
  cgstAmount:     { type: Number, default: 0 },
  sgstAmount:     { type: Number, default: 0 },
  cessAmount:     { type: Number, default: 0 },
  totalTax:       { type: Number, default: 0 },
  invoiceValue:   { type: Number, default: 0 },
  reverseCharge:  { type: Boolean, default: false },
  lines:          [gstInvoiceLineSchema],
  gstr1Period:    { type: String },       // Reported in GSTR-1 period
  gstr3bPeriod:   { type: String },       // Reported in GSTR-3B period
  eInvoice:       { type: ObjectId, ref: 'EInvoice' },
  eWayBill:       { type: ObjectId, ref: 'EWayBill' },
  period:         { type: ObjectId, ref: 'AccountingPeriod' },
  fiscalYear:     { type: ObjectId, ref: 'FiscalYear' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

gstInvoiceSchema.index({ invoiceDate: -1 });
gstInvoiceSchema.index({ invoiceType: 1, invoiceDate: -1 });
gstInvoiceSchema.index({ partyGSTIN: 1 });
gstInvoiceSchema.index({ gstr1Period: 1 });

gstInvoiceSchema.pre('validate', async function (next) {
  if (!this.gstInvoiceNumber) {
    const yr = new Date().getFullYear();
    const prefix = `GSTI-${yr}-`;
    const count = await this.constructor.countDocuments({ gstInvoiceNumber: { $regex: `^${prefix}` } });
    this.gstInvoiceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('GSTInvoice', gstInvoiceSchema);
