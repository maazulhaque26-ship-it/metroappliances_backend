const mongoose = require('mongoose');

const cashForecastSchema = new mongoose.Schema({
  forecastNumber:  { type: String, unique: true },
  forecastDate:    { type: Date, required: true },
  forecastPeriod:  { type: String, required: true, trim: true },
  currency:        { type: String, default: 'INR', uppercase: true },
  openingBalance:  { type: Number, default: 0 },
  expectedReceipts:{ type: Number, default: 0 },
  expectedPayments:{ type: Number, default: 0 },
  netCashFlow:     { type: Number, default: 0 },
  closingForecast: { type: Number, default: 0 },
  actualReceipts:  { type: Number, default: 0 },
  actualPayments:  { type: Number, default: 0 },
  actualClosing:   { type: Number, default: 0 },
  variance:        { type: Number, default: 0 },
  confidenceLevel: { type: String, enum: ['low','medium','high'], default: 'medium' },
  notes:           { type: String, trim: true },
  status:          { type: String, enum: ['draft','approved','actual'], default: 'draft' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

cashForecastSchema.pre('validate', async function (next) {
  if (this.forecastNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.forecastNumber = `CF-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

cashForecastSchema.index({ forecastDate: -1 });
cashForecastSchema.index({ status: 1 });

module.exports = mongoose.model('CashForecast', cashForecastSchema);
