const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Payment Advice — formal advice sent to vendor about payment
const paymentAdviceSchema = new Schema({
  adviceNumber:   { type: String, unique: true },
  vendor:         { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:     { type: String, trim: true },
  payment:        { type: ObjectId, ref: 'VendorPayment' },
  paymentBatch:   { type: ObjectId, ref: 'PaymentBatch' },
  adviceDate:     { type: Date, default: Date.now },
  paymentDate:    { type: Date },
  paymentMethod:  { type: String },
  bankReference:  { type: String },
  totalAmount:    { type: Number, default: 0 },
  tdsAmount:      { type: Number, default: 0 },
  netAmount:      { type: Number, default: 0 },
  billsCovered: [{
    vendorBill:   { type: ObjectId, ref: 'VendorBill' },
    billNumber:   String,
    billDate:     Date,
    billAmount:   Number,
    paidAmount:   Number,
  }],
  sentTo:         { type: String },       // email
  sentAt:         { type: Date },
  status:         { type: String, enum: ['draft','sent','acknowledged'], default: 'draft' },
  createdBy:      { type: ObjectId, ref: 'User' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

paymentAdviceSchema.index({ vendor: 1, isDeleted: 1 });
paymentAdviceSchema.index({ status: 1 });

paymentAdviceSchema.pre('save', async function (next) {
  if (!this.adviceNumber) {
    const prefix = `PA-${new Date().getFullYear()}-`;
    const count = await this.constructor.countDocuments({ adviceNumber: { $regex: `^${prefix}` } });
    this.adviceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentAdvice', paymentAdviceSchema);
