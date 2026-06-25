const mongoose = require('mongoose');

const pettyCashVoucherSchema = new mongoose.Schema({
  voucherNumber: { type: String, unique: true },
  pettyCash:     { type: mongoose.Schema.Types.ObjectId, ref: 'PettyCash', required: true },
  voucherDate:   { type: Date, required: true },
  amount:        { type: Number, required: true, min: 0 },
  purpose:       { type: String, required: true, trim: true },
  expenseHead:   { type: String, trim: true },
  payee:         { type: String, trim: true },
  approvedBy:    { type: String, trim: true },
  receiptNo:     { type: String, trim: true },
  status:        { type: String, enum: ['draft','approved','paid','rejected'], default: 'draft' },
  glAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  journalEntry:  { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

pettyCashVoucherSchema.pre('validate', async function (next) {
  if (this.voucherNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.voucherNumber = `PCV-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

pettyCashVoucherSchema.index({ pettyCash: 1, voucherDate: -1 });
pettyCashVoucherSchema.index({ status: 1 });

module.exports = mongoose.model('PettyCashVoucher', pettyCashVoucherSchema);
