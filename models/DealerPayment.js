const mongoose = require('mongoose');

const dealerPaymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, unique: true }, // MTR-PAY-YYYYMM-XXXXX

  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },

  amount: { type: Number, required: true, min: 0 },

  type: {
    type: String,
    enum: ['payment', 'refund', 'adjustment', 'credit_note', 'wallet_topup'],
    required: true,
  },

  method: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'upi', 'neft', 'rtgs', 'cash', 'wallet', 'other'],
    required: true,
  },

  referenceNumber: { type: String, default: '' }, // UTR / cheque number / UPI ref

  // Bank details snapshot for bank/cheque payments
  bankDetails: {
    accountName:   { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode:      { type: String, default: '' },
    bankName:      { type: String, default: '' },
  },

  // ── Invoice linkage ────────────────────────────────────────────────────────
  invoices: [{
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'DealerInvoice' },
    amount:  { type: Number, min: 0 },
  }],

  // ── Status ─────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'reversed'],
    default: 'pending',
  },
  verifiedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt:    { type: Date, default: null },
  failureReason: { type: String, default: '' },

  // ── Metadata ──────────────────────────────────────────────────────────────
  notes:         { type: String, default: '' },
  adminNotes:    { type: String, default: '' },
  attachmentUrl: { type: String, default: '' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = dealer self
}, { timestamps: true });

dealerPaymentSchema.pre('save', async function (next) {
  if (this.paymentNumber) return next();
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = await mongoose.model('DealerPayment').countDocuments() + 1;
  this.paymentNumber = `MTR-PAY-${ym}-${String(seq).padStart(5, '0')}`;
  next();
});

dealerPaymentSchema.index({ dealer: 1, createdAt: -1 });
dealerPaymentSchema.index({ status: 1 });
dealerPaymentSchema.index({ type: 1 });

module.exports = mongoose.model('DealerPayment', dealerPaymentSchema);
