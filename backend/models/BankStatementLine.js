const mongoose = require('mongoose');

const bankStatementLineSchema = new mongoose.Schema({
  bankStatement:   { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatement', required: true },
  bankAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  lineDate:        { type: Date, required: true },
  valueDate:       { type: Date },
  description:     { type: String, trim: true },
  reference:       { type: String, trim: true },
  chequeNo:        { type: String, trim: true },
  debit:           { type: Number, default: 0 },
  credit:          { type: Number, default: 0 },
  balance:         { type: Number, default: 0 },
  matchStatus:     { type: String, enum: ['unmatched','matched','partial','excluded'], default: 'unmatched' },
  bankTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' },
  matchedOn:       { type: Date },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

bankStatementLineSchema.index({ bankStatement: 1, lineDate: 1 });
bankStatementLineSchema.index({ bankAccount: 1, matchStatus: 1 });

module.exports = mongoose.model('BankStatementLine', bankStatementLineSchema);
