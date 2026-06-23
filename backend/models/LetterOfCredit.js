const mongoose = require('mongoose');

const letterOfCreditSchema = new mongoose.Schema({
  lcNumber:        { type: String, unique: true },
  lcReferenceNo:   { type: String, trim: true },
  lcType:          { type: String, enum: ['import','export','inland','standby','revolving','confirmed'], required: true },
  bankAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  applicant:       { type: String, required: true, trim: true },
  beneficiary:     { type: String, required: true, trim: true },
  beneficiaryBank: { type: String, trim: true },
  amount:          { type: Number, required: true, min: 0 },
  currency:        { type: String, default: 'INR', uppercase: true },
  issueDate:       { type: Date, required: true },
  expiryDate:      { type: Date, required: true },
  shipmentDeadline:{ type: Date },
  paymentTerms:    { type: String, trim: true },
  documentsRequired:{ type: [String], default: [] },
  utilizationAmount:{ type: Number, default: 0 },
  outstandingAmount:{ type: Number, default: 0 },
  commission:      { type: Number, default: 0 },
  glAccount:       { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  status:          { type: String, enum: ['draft','issued','active','partially_utilized','fully_utilized','expired','cancelled'], default: 'draft' },
  notes:           { type: String, trim: true },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

letterOfCreditSchema.pre('validate', async function (next) {
  if (this.lcNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.lcNumber = `LC-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

letterOfCreditSchema.index({ bankAccount: 1, status: 1 });
letterOfCreditSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('LetterOfCredit', letterOfCreditSchema);
