const mongoose = require('mongoose');

const dealerWalletSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    unique: true,
  },

  // ── Balances ──────────────────────────────────────────────────────────────
  totalBalance:      { type: Number, default: 0, min: 0 },
  availableBalance:  { type: Number, default: 0, min: 0 }, // totalBalance - blockedBalance
  blockedBalance:    { type: Number, default: 0, min: 0 }, // reserved for pending orders
  pendingSettlement: { type: Number, default: 0, min: 0 }, // incoming but not yet cleared

  // ── Last recharge snapshot ─────────────────────────────────────────────────
  lastRecharge: {
    amount:    { type: Number, default: 0 },
    date:      { type: Date,   default: null },
    method:    { type: String, default: '' },
    reference: { type: String, default: '' },
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

dealerWalletSchema.index({ dealer: 1 });

module.exports = mongoose.model('DealerWallet', dealerWalletSchema);
