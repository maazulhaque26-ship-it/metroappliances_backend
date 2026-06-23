const mongoose = require('mongoose');

const creditHistorySchema = new mongoose.Schema({
  action:        { type: String, enum: ['set', 'update', 'hold', 'release', 'expire', 'reset'], required: true },
  previousLimit: { type: Number, default: 0 },
  newLimit:      { type: Number, default: 0 },
  reason:        { type: String, default: '' },
  performedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performedAt:   { type: Date, default: Date.now },
}, { _id: true });

const dealerCreditSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    unique: true,
  },

  creditLimit:     { type: Number, default: 0, min: 0 },
  usedCredit:      { type: Number, default: 0, min: 0 },
  remainingCredit: { type: Number, default: 0 }, // kept in sync: creditLimit - usedCredit

  creditExpiry: { type: Date, default: null },
  creditStatus: {
    type: String,
    enum: ['none', 'active', 'expired', 'hold', 'suspended'],
    default: 'none',
  },

  isOnHold:   { type: Boolean, default: false },
  holdReason: { type: String, default: '' },

  setBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  history: { type: [creditHistorySchema], default: [] },
}, { timestamps: true });

// Keep remainingCredit in sync
dealerCreditSchema.pre('save', function (next) {
  this.remainingCredit = Math.max(0, this.creditLimit - this.usedCredit);

  // Auto-expire
  if (this.creditExpiry && new Date() > this.creditExpiry && this.creditStatus === 'active') {
    this.creditStatus = 'expired';
  }
  next();
});

dealerCreditSchema.index({ dealer: 1 });
dealerCreditSchema.index({ creditStatus: 1 });

module.exports = mongoose.model('DealerCredit', dealerCreditSchema);
