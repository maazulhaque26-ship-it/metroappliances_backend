const mongoose = require('mongoose');

const dealerLedgerSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },

  entryNumber: { type: String, unique: true }, // MTR-LE-YYYYMM-XXXXX

  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true,
  },

  category: {
    type: String,
    enum: [
      'order',            // debit when order placed
      'payment',          // credit when payment received
      'refund',           // credit on refund
      'wallet_topup',     // credit wallet topup
      'wallet_deduct',    // debit wallet deduction
      'credit_note',      // credit from credit note
      'adjustment',       // manual admin adjustment
      'invoice_charge',   // debit on invoice issued
      'reversal',         // reversal entry
    ],
    required: true,
  },

  amount:         { type: Number, required: true, min: 0 },
  runningBalance: { type: Number, required: true }, // balance AFTER this entry (can be negative for overdue)

  description: { type: String, required: true, maxlength: 500 },

  // ── Reference to source document ─────────────────────────────────────────
  refType: {
    type: String,
    enum: ['DealerOrder', 'DealerInvoice', 'DealerPayment', 'DealerCreditNote', 'DealerWallet', 'manual'],
    default: 'manual',
  },
  refId:     { type: mongoose.Schema.Types.ObjectId, default: null },
  reference: { type: String, default: '' }, // human-readable ref (order no / invoice no)

  // ── Invoice linkage for overdue tracking ──────────────────────────────────
  dueDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['paid', 'overdue', 'pending', 'na'],
    default: 'na',
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system
  notes:     { type: String, default: '' },
}, { timestamps: true });

dealerLedgerSchema.pre('save', async function (next) {
  if (this.entryNumber) return next();
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = await mongoose.model('DealerLedger').countDocuments() + 1;
  this.entryNumber = `MTR-LE-${ym}-${String(seq).padStart(5, '0')}`;
  next();
});

dealerLedgerSchema.index({ dealer: 1, createdAt: -1 });
dealerLedgerSchema.index({ dealer: 1, status: 1 });
dealerLedgerSchema.index({ refType: 1, refId: 1 });

module.exports = mongoose.model('DealerLedger', dealerLedgerSchema);
