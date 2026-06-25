const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const arAgingBucketSchema = new Schema({
  current:      { type: Number, default: 0 },
  days1_30:     { type: Number, default: 0 },
  days31_60:    { type: Number, default: 0 },
  days61_90:    { type: Number, default: 0 },
  days91_120:   { type: Number, default: 0 },
  days180Plus:  { type: Number, default: 0 },
  total:        { type: Number, default: 0 },
}, { _id: false });

const customerAgingSchema = new Schema({
  customer:            { type: ObjectId, ref: 'User', required: true },
  customerName:        { type: String, trim: true },
  asOfDate:            { type: Date, required: true, default: Date.now },
  aging:               { type: arAgingBucketSchema, default: () => ({}) },
  outstandingInvoices: [{
    customerInvoice:  { type: ObjectId, ref: 'CustomerInvoice' },
    invoiceNumber:    String,
    invoiceDate:      Date,
    dueDate:          Date,
    totalAmount:      Number,
    paidAmount:       Number,
    outstanding:      Number,
    daysOverdue:      Number,
    agingBucket:      { type: String, enum: ['current','1-30','31-60','61-90','91-120','180+'] },
  }],
  totalOutstanding:    { type: Number, default: 0 },
  totalOverdue:        { type: Number, default: 0 },
  isDeleted:           { type: Boolean, default: false },
}, { timestamps: true });

customerAgingSchema.index({ customer: 1, asOfDate: -1 });
customerAgingSchema.index({ asOfDate: -1 });

module.exports = mongoose.model('CustomerAging', customerAgingSchema);
