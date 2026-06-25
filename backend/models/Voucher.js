const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  voucherNumber: { type: String, unique: true },
  voucherType:   { type: String, required: true, enum: ['JV','PV','RV','CV','DN','CN','BV','OB','CL'] },
  voucherSeries: { type: mongoose.Schema.Types.ObjectId, ref: 'VoucherSeries' },
  journalEntry:  { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  voucherDate:   { type: Date, required: true },
  narration:     { type: String, required: true, trim: true },
  amount:        { type: Number, required: true, min: 0 },
  currency:      { type: String, default: 'INR' },
  paymentMode:   { type: String, enum: ['cash','bank','cheque','upi','neft','rtgs','dd','other'], default: 'cash' },
  bankRef:       { type: String, default: '' },
  status:        { type: String, enum: ['draft','approved','posted','cancelled'], default: 'draft' },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments:   [{ fileName: String, fileUrl: String }],
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

voucherSchema.index({ voucherType: 1, voucherDate: -1 });

voucherSchema.pre('validate', async function (next) {
  if (this.voucherNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.voucherNumber = `VCH-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Voucher', voucherSchema);
