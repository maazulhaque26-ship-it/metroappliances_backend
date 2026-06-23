const mongoose = require('mongoose');

const fiscalYearSchema = new mongoose.Schema({
  yearCode:     { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  status:       { type: String, enum: ['open','closed','locked'], default: 'open' },
  baseCurrency: { type: String, default: 'INR' },
  closedAt:     { type: Date },
  closedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

fiscalYearSchema.pre('validate', async function (next) {
  if (this.yearCode) return next();
  const count = await this.constructor.countDocuments();
  this.yearCode = `FY-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('FiscalYear', fiscalYearSchema);
