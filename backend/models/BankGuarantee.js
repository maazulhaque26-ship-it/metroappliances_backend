const mongoose = require('mongoose');

const bankGuaranteeSchema = new mongoose.Schema({
  bgNumber:       { type: String, unique: true },
  bgReferenceNo:  { type: String, trim: true },
  bankAccount:    { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  guaranteeType:  { type: String, enum: ['financial','performance','advance_payment','bid_bond','retention','customs','other'], required: true },
  amount:         { type: Number, required: true, min: 0 },
  currency:       { type: String, default: 'INR', uppercase: true },
  beneficiary:    { type: String, required: true, trim: true },
  purpose:        { type: String, trim: true },
  issueDate:      { type: Date, required: true },
  expiryDate:     { type: Date, required: true },
  claimDate:      { type: Date },
  claimAmount:    { type: Number, default: 0 },
  commission:     { type: Number, default: 0 },
  margin:         { type: Number, default: 0 },
  glAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  status:         { type: String, enum: ['draft','issued','active','expired','cancelled','invoked'], default: 'draft' },
  notes:          { type: String, trim: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

bankGuaranteeSchema.pre('validate', async function (next) {
  if (this.bgNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.bgNumber = `BG-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

bankGuaranteeSchema.index({ bankAccount: 1, status: 1 });
bankGuaranteeSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('BankGuarantee', bankGuaranteeSchema);
