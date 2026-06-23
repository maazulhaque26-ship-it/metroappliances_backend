const mongoose = require('mongoose');

const voucherSeriesSchema = new mongoose.Schema({
  seriesCode:  { type: String, unique: true },
  name:        { type: String, required: true, trim: true },
  voucherType: { type: String, required: true, enum: ['JV','PV','RV','CV','DN','CN','BV','OB','CL'] },
  prefix:      { type: String, required: true },
  suffix:      { type: String, default: '' },
  startNumber: { type: Number, default: 1 },
  currentNumber:{ type: Number, default: 0 },
  padding:     { type: Number, default: 5 },
  fiscalYear:  { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  isDefault:   { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

voucherSeriesSchema.pre('validate', async function (next) {
  if (this.seriesCode) return next();
  const count = await this.constructor.countDocuments();
  this.seriesCode = `VS-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('VoucherSeries', voucherSeriesSchema);
