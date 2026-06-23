const mongoose = require('mongoose');

const paymentGatewayTransactionSchema = new mongoose.Schema({
  transactionNumber:  { type: String, unique: true },
  paymentGateway:     { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentGateway', required: true },
  gatewayOrderId:     { type: String, trim: true },
  gatewayPaymentId:   { type: String, trim: true },
  gatewaySignature:   { type: String, trim: true },
  amount:             { type: Number, required: true, min: 0 },
  currency:           { type: String, default: 'INR', uppercase: true },
  paymentMode:        { type: String, enum: ['card','upi','netbanking','wallet','emi','other'], default: 'other' },
  customerName:       { type: String, trim: true },
  customerEmail:      { type: String, trim: true, lowercase: true },
  customerPhone:      { type: String, trim: true },
  orderReference:     { type: String, trim: true },
  status:             { type: String, enum: ['initiated','pending','captured','failed','refunded','partially_refunded'], default: 'initiated' },
  gatewayFee:         { type: Number, default: 0 },
  netSettled:         { type: Number, default: 0 },
  settlementDate:     { type: Date },
  bankTransaction:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' },
  failureReason:      { type: String, trim: true },
  rawResponse:        { type: mongoose.Schema.Types.Mixed },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

paymentGatewayTransactionSchema.pre('validate', async function (next) {
  if (this.transactionNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.transactionNumber = `PGT-${year}-${String(count + 1).padStart(7, '0')}`;
  next();
});

paymentGatewayTransactionSchema.index({ paymentGateway: 1, createdAt: -1 });
paymentGatewayTransactionSchema.index({ gatewayPaymentId: 1 });
paymentGatewayTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('PaymentGatewayTransaction', paymentGatewayTransactionSchema);
