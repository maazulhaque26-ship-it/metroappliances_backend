const mongoose = require('mongoose');

const liquidityForecastSchema = new mongoose.Schema({
  forecastNumber: { type: String, unique: true },
  forecastDate:   { type: Date, required: true },
  horizon:        { type: String, enum: ['daily','weekly','monthly','quarterly'], default: 'monthly' },
  currency:       { type: String, default: 'INR', uppercase: true },
  items: [{
    itemDate:     { type: Date },
    description:  { type: String, trim: true },
    category:     { type: String, enum: ['operating','investing','financing'], default: 'operating' },
    inflow:       { type: Number, default: 0 },
    outflow:      { type: Number, default: 0 },
    netFlow:      { type: Number, default: 0 },
    cumulativeBalance: { type: Number, default: 0 },
  }],
  openingBalance: { type: Number, default: 0 },
  totalInflow:    { type: Number, default: 0 },
  totalOutflow:   { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  notes:          { type: String, trim: true },
  status:         { type: String, enum: ['draft','approved'], default: 'draft' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

liquidityForecastSchema.pre('validate', async function (next) {
  if (this.forecastNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.forecastNumber = `LF-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

liquidityForecastSchema.index({ forecastDate: -1 });
liquidityForecastSchema.index({ horizon: 1, status: 1 });

module.exports = mongoose.model('LiquidityForecast', liquidityForecastSchema);
