const mongoose = require('mongoose');

const financialSettingSchema = new mongoose.Schema({
  company:          { type: String, required: true, trim: true },
  baseCurrency:     { type: String, default: 'INR' },
  fiscalYearStart:  { type: String, default: '04-01', comment: 'MM-DD' },
  fiscalYearEnd:    { type: String, default: '03-31', comment: 'MM-DD' },
  roundingMethod:   { type: String, enum: ['round','floor','ceil'], default: 'round' },
  decimalPlaces:    { type: Number, default: 2 },
  autoPostJournals: { type: Boolean, default: false },
  requireApproval:  { type: Boolean, default: true },
  defaultCostCenter:{ type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  arAccount:        { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  apAccount:        { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  cashAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  bankAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  revenueAccount:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  cogsAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  retainedEarnings: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FinancialSetting', financialSettingSchema);
