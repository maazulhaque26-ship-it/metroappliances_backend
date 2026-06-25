const mongoose = require('mongoose');

const bankStatementSchema = new mongoose.Schema({
  statementNumber:  { type: String, unique: true },
  bankAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  statementDate:    { type: Date, required: true },
  fromDate:         { type: Date, required: true },
  toDate:           { type: Date, required: true },
  openingBalance:   { type: Number, default: 0 },
  closingBalance:   { type: Number, default: 0 },
  totalCredits:     { type: Number, default: 0 },
  totalDebits:      { type: Number, default: 0 },
  lineCount:        { type: Number, default: 0 },
  importedFrom:     { type: String, enum: ['manual','csv','excel','api'], default: 'manual' },
  fileName:         { type: String, trim: true },
  status:           { type: String, enum: ['imported','reconciling','reconciled'], default: 'imported' },
  reconciledOn:     { type: Date },
  reconciledBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

bankStatementSchema.pre('validate', async function (next) {
  if (this.statementNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.statementNumber = `BSTMT-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

bankStatementSchema.index({ bankAccount: 1, fromDate: -1 });
bankStatementSchema.index({ status: 1 });

module.exports = mongoose.model('BankStatement', bankStatementSchema);
