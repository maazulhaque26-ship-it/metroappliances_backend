const mongoose = require('mongoose');

const bankReconciliationSchema = new mongoose.Schema({
  reconciliationNumber: { type: String, unique: true },
  bankAccount:          { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  bankStatement:        { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatement' },
  reconciliationDate:   { type: Date, required: true },
  fromDate:             { type: Date, required: true },
  toDate:               { type: Date, required: true },
  statementBalance:     { type: Number, default: 0 },
  bookBalance:          { type: Number, default: 0 },
  difference:           { type: Number, default: 0 },
  totalMatched:         { type: Number, default: 0 },
  totalUnmatched:       { type: Number, default: 0 },
  status:               { type: String, enum: ['in_progress','completed','approved'], default: 'in_progress' },
  completedOn:          { type: Date },
  completedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:                { type: String, trim: true },
  isDeleted:            { type: Boolean, default: false },
}, { timestamps: true });

bankReconciliationSchema.pre('validate', async function (next) {
  if (this.reconciliationNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.reconciliationNumber = `RECON-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

bankReconciliationSchema.index({ bankAccount: 1, reconciliationDate: -1 });
bankReconciliationSchema.index({ status: 1 });

module.exports = mongoose.model('BankReconciliation', bankReconciliationSchema);
