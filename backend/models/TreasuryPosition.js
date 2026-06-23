const mongoose = require('mongoose');

const treasuryPositionSchema = new mongoose.Schema({
  positionNumber: { type: String, unique: true },
  positionDate:   { type: Date, required: true },
  currency:       { type: String, default: 'INR', uppercase: true },
  bankBalance:    { type: Number, default: 0 },
  cashBalance:    { type: Number, default: 0 },
  investmentBalance: { type: Number, default: 0 },
  fdBalance:      { type: Number, default: 0 },
  totalAssets:    { type: Number, default: 0 },
  overdraftUsed:  { type: Number, default: 0 },
  netPosition:    { type: Number, default: 0 },
  openingPosition:{ type: Number, default: 0 },
  closingPosition:{ type: Number, default: 0 },
  receiptsTotal:  { type: Number, default: 0 },
  paymentsTotal:  { type: Number, default: 0 },
  notes:          { type: String, trim: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

treasuryPositionSchema.pre('validate', async function (next) {
  if (this.positionNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.positionNumber = `TPOS-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

treasuryPositionSchema.index({ positionDate: -1 });
treasuryPositionSchema.index({ currency: 1, positionDate: -1 });

module.exports = mongoose.model('TreasuryPosition', treasuryPositionSchema);
