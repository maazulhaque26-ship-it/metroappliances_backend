const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema({
  gatewayCode:   { type: String, required: true, unique: true, uppercase: true, trim: true },
  gatewayName:   { type: String, required: true, trim: true },
  provider:      { type: String, required: true, enum: ['razorpay','stripe','cashfree','paypal','paytm','ccavenue','custom'] },
  mode:          { type: String, enum: ['test','live'], default: 'test' },
  supportedModes:{ type: [String], default: ['card','upi','netbanking','wallet'] },
  currency:      { type: String, default: 'INR', uppercase: true },
  settlementDays:{ type: Number, default: 2 },
  feePercent:    { type: Number, default: 0 },
  fixedFee:      { type: Number, default: 0 },
  webhookUrl:    { type: String, trim: true },
  bankAccount:   { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  glAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

paymentGatewaySchema.index({ provider: 1, isActive: 1 });

module.exports = mongoose.model('PaymentGateway', paymentGatewaySchema);
