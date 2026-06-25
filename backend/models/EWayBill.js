'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const eWayBillSchema = new Schema({
  eWayBillNumber:  { type: String, unique: true },
  ewbNo:           { type: String, unique: true, sparse: true, trim: true },  // Government EWB Number
  ewbDate:         { type: Date },
  validUpto:       { type: Date },
  customerInvoice: { type: ObjectId, ref: 'CustomerInvoice' },
  gstInvoice:      { type: ObjectId, ref: 'GSTInvoice' },
  eInvoice:        { type: ObjectId, ref: 'EInvoice' },
  invoiceNo:       { type: String, trim: true },
  invoiceDate:     { type: Date },
  invoiceValue:    { type: Number, default: 0 },
  taxableValue:    { type: Number, default: 0 },
  totalTax:        { type: Number, default: 0 },
  supplyType:      { type: String, enum: ['outward','inward'], default: 'outward' },
  subSupplyType:   { type: String, enum: ['supply','import','export','job_work','SKD_CKD','line_sales','sales_return','exhibition','recipient_own_use'], default: 'supply' },
  fromGSTIN:       { type: String, required: true, trim: true },
  fromName:        { type: String, trim: true },
  fromAddress:     { type: String, trim: true },
  fromState:       { type: String, trim: true },
  fromPincode:     { type: String, trim: true },
  toGSTIN:         { type: String, trim: true },
  toName:          { type: String, trim: true },
  toAddress:       { type: String, trim: true },
  toState:         { type: String, trim: true },
  toPincode:       { type: String, trim: true },
  transportMode:   { type: String, enum: ['road','rail','air','ship'], default: 'road' },
  distance:        { type: Number, default: 0 },
  transporterName: { type: String, trim: true },
  transporterId:   { type: String, trim: true },
  vehicleNo:       { type: String, trim: true, uppercase: true },
  vehicleType:     { type: String, enum: ['regular','over_dimensional_cargo','ODC'], default: 'regular' },
  transDocNo:      { type: String, trim: true },
  transDocDate:    { type: Date },
  status:          { type: String, enum: ['pending','generated','in_transit','delivered','cancelled','expired'], default: 'pending' },
  cancellationReason: { type: String, trim: true },
  cancelledDate:   { type: Date },
  errorMessage:    { type: String, trim: true },
  jsonPayload:     { type: Schema.Types.Mixed },
  generatedBy:     { type: ObjectId, ref: 'User' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

eWayBillSchema.index({ status: 1 });
eWayBillSchema.index({ fromGSTIN: 1, ewbDate: -1 });
eWayBillSchema.index({ validUpto: 1 });

eWayBillSchema.pre('validate', async function (next) {
  if (!this.eWayBillNumber) {
    const yr = new Date().getFullYear();
    const prefix = `EWB-${yr}-`;
    const count = await this.constructor.countDocuments({ eWayBillNumber: { $regex: `^${prefix}` } });
    this.eWayBillNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('EWayBill', eWayBillSchema);
