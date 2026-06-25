const mongoose = require('mongoose');

const reconciliationMatchSchema = new mongoose.Schema({
  reconciliation:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankReconciliation', required: true },
  bankTransaction:   { type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' },
  statementLine:     { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatementLine' },
  matchType:         { type: String, enum: ['auto','manual','partial'], default: 'manual' },
  matchDate:         { type: Date, default: Date.now },
  transactionAmount: { type: Number, default: 0 },
  statementAmount:   { type: Number, default: 0 },
  difference:        { type: Number, default: 0 },
  status:            { type: String, enum: ['matched','disputed','reversed'], default: 'matched' },
  matchedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:             { type: String, trim: true },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

reconciliationMatchSchema.index({ reconciliation: 1 });
reconciliationMatchSchema.index({ bankTransaction: 1 });
reconciliationMatchSchema.index({ statementLine: 1 });

module.exports = mongoose.model('ReconciliationMatch', reconciliationMatchSchema);
