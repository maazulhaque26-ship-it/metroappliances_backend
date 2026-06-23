const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  fromCurrency: { type: String, required: true, uppercase: true, trim: true },
  toCurrency:   { type: String, required: true, uppercase: true, trim: true },
  rate:         { type: Number, required: true, min: 0 },
  effectiveDate:{ type: Date, required: true },
  expiryDate:   { type: Date },
  source:       { type: String, default: 'manual' },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

exchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1, effectiveDate: -1 });

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
