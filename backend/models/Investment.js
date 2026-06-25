const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  investmentNumber: { type: String, unique: true },
  investmentName:   { type: String, required: true, trim: true },
  investmentType:   { type: String, required: true, enum: ['mutual_fund','equity','bonds','government_securities','liquid_fund','treasury_bill','other'] },
  principalAmount:  { type: Number, required: true, min: 0 },
  currentValue:     { type: Number, default: 0 },
  purchaseDate:     { type: Date, required: true },
  maturityDate:     { type: Date },
  expectedReturn:   { type: Number, default: 0 },
  actualReturn:     { type: Number, default: 0 },
  currency:         { type: String, default: 'INR', uppercase: true },
  folio:            { type: String, trim: true },
  units:            { type: Number, default: 0 },
  nav:              { type: Number, default: 0 },
  bankAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  glAccount:        { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  status:           { type: String, enum: ['active','matured','redeemed','cancelled'], default: 'active' },
  redemptionDate:   { type: Date },
  redemptionAmount: { type: Number, default: 0 },
  notes:            { type: String, trim: true },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

investmentSchema.pre('validate', async function (next) {
  if (this.investmentNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.investmentNumber = `INVT-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

investmentSchema.index({ investmentType: 1, status: 1 });
investmentSchema.index({ maturityDate: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
