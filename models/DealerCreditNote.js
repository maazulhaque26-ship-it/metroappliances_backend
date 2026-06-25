const mongoose = require('mongoose');

const dealerCreditNoteSchema = new mongoose.Schema({
  creditNoteNumber: { type: String, unique: true }, // MTR-CN-YYYYMM-XXXXX

  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerOrder',
    default: null,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerInvoice',
    default: null,
  },

  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, maxlength: 1000 },

  type: {
    type: String,
    enum: ['return', 'overcharge', 'quality', 'admin_discretion', 'other'],
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'applied', 'rejected'],
    default: 'pending',
  },

  // When applied, ledger entry ref
  appliedAt:          { type: Date, default: null },
  appliedLedgerEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'DealerLedger', default: null },

  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt:       { type: Date, default: null },
  rejectionReason:  { type: String, default: '' },

  notes: { type: String, default: '' },
}, { timestamps: true });

dealerCreditNoteSchema.pre('save', async function (next) {
  if (this.creditNoteNumber) return next();
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = await mongoose.model('DealerCreditNote').countDocuments() + 1;
  this.creditNoteNumber = `MTR-CN-${ym}-${String(seq).padStart(5, '0')}`;
  next();
});

dealerCreditNoteSchema.index({ dealer: 1, createdAt: -1 });
dealerCreditNoteSchema.index({ status: 1 });

module.exports = mongoose.model('DealerCreditNote', dealerCreditNoteSchema);
