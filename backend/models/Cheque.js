const mongoose = require('mongoose');

const chequeSchema = new mongoose.Schema({
  chequeNumber:   { type: String, required: true, trim: true },
  chequeBook:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChequeBook' },
  bankAccount:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  chequeDate:     { type: Date, required: true },
  amount:         { type: Number, required: true, min: 0 },
  payee:          { type: String, required: true, trim: true },
  narration:      { type: String, trim: true },
  chequeType:     { type: String, enum: ['issued','received'], required: true },
  status:         { type: String, enum: ['draft','issued','presented','cleared','bounced','cancelled','stopped'], default: 'draft' },
  clearingDate:   { type: Date },
  bouncedDate:    { type: Date },
  bounceReason:   { type: String, trim: true },
  bankTransaction:{ type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

chequeSchema.index({ bankAccount: 1, chequeDate: -1 });
chequeSchema.index({ chequeNumber: 1, bankAccount: 1 });
chequeSchema.index({ status: 1 });

module.exports = mongoose.model('Cheque', chequeSchema);
