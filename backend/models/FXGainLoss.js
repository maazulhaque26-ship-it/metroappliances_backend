const mongoose = require('mongoose');

const fxGainLossSchema = new mongoose.Schema({
  glNumber:       { type: String, unique: true },
  postingDate:    { type: Date, required: true },
  period:         { type: String, trim: true },
  currency:       { type: String, required: true, uppercase: true, trim: true },
  bookRate:       { type: Number, required: true },
  currentRate:    { type: Number, required: true },
  openingBalance: { type: Number, default: 0 },
  gainLossAmount: { type: Number, default: 0 },
  gainLossType:   { type: String, enum: ['realized','unrealized'], required: true },
  sourceModule:   { type: String, default: '' },
  sourceId:       { type: mongoose.Schema.Types.ObjectId },
  fxTransaction:  { type: mongoose.Schema.Types.ObjectId, ref: 'FXTransaction' },
  currencyAccount:{ type: mongoose.Schema.Types.ObjectId, ref: 'CurrencyAccount' },
  journalEntry:   { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

fxGainLossSchema.pre('validate', async function (next) {
  if (this.glNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.glNumber = `FXGL-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

fxGainLossSchema.index({ postingDate: -1 });
fxGainLossSchema.index({ currency: 1, postingDate: -1 });
fxGainLossSchema.index({ gainLossType: 1 });

module.exports = mongoose.model('FXGainLoss', fxGainLossSchema);
