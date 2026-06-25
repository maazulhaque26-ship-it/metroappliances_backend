const mongoose = require('mongoose');

const accountingPeriodSchema = new mongoose.Schema({
  periodCode:  { type: String, unique: true },
  fiscalYear:  { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear', required: true },
  periodName:  { type: String, required: true, trim: true },
  periodNumber:{ type: Number, required: true, min: 1, max: 12 },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  status:      { type: String, enum: ['open','closed','locked'], default: 'open' },
  closedAt:    { type: Date },
  closedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

accountingPeriodSchema.pre('validate', async function (next) {
  if (this.periodCode) return next();
  const count = await this.constructor.countDocuments();
  this.periodCode = `AP-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('AccountingPeriod', accountingPeriodSchema);
