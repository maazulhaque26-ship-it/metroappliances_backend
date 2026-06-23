const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Vendor Aging — snapshot of aged payables per vendor
const agingBucketSchema = new Schema({
  current:   { type: Number, default: 0 },   // Not yet due
  days1_30:  { type: Number, default: 0 },
  days31_60: { type: Number, default: 0 },
  days61_90: { type: Number, default: 0 },
  days91_120:{ type: Number, default: 0 },
  days120Plus:{ type: Number, default: 0 },
  total:     { type: Number, default: 0 },
}, { _id: false });

const vendorAgingSchema = new Schema({
  vendor:        { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:    { type: String, trim: true },
  asOfDate:      { type: Date, required: true, default: Date.now },
  aging:         { type: agingBucketSchema, default: () => ({}) },
  outstandingBills: [{
    vendorBill:   { type: ObjectId, ref: 'VendorBill' },
    billNumber:   String,
    billDate:     Date,
    dueDate:      Date,
    totalAmount:  Number,
    paidAmount:   Number,
    outstanding:  Number,
    daysOverdue:  Number,
    agingBucket:  { type: String, enum: ['current','1-30','31-60','61-90','91-120','120+'] },
  }],
  totalOutstanding: { type: Number, default: 0 },
  totalOverdue:     { type: Number, default: 0 },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

vendorAgingSchema.index({ vendor: 1, asOfDate: -1 });
vendorAgingSchema.index({ asOfDate: -1 });

module.exports = mongoose.model('VendorAging', vendorAgingSchema);
