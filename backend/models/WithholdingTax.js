const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const withholdingTaxSchema = new Schema({
  taxCode:        { type: String, unique: true },
  taxType:        { type: String, enum: ['TDS','TCS','WHT'], default: 'TDS' },
  section:        { type: String, trim: true },   // e.g. 194C, 194J, 194I
  description:    { type: String, trim: true },
  rate:           { type: Number, required: true, min: 0, max: 100 },
  surchargeRate:  { type: Number, default: 0 },
  cessRate:       { type: Number, default: 0 },
  effectiveRate:  { type: Number, default: 0 },   // rate + surcharge + cess
  thresholdLimit: { type: Number, default: 0 },   // Annual threshold before TDS applies
  applicableTo:   { type: String, enum: ['all','company','individual','partnership','huf','foreign'], default: 'all' },
  glAccount:      { type: ObjectId, ref: 'ChartOfAccount' },
  isActive:       { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

withholdingTaxSchema.index({ taxType: 1, isActive: 1 });

withholdingTaxSchema.pre('validate', async function (next) {
  if (!this.taxCode) {
    const prefix = `WHT-`;
    const count = await this.constructor.countDocuments({ taxCode: { $regex: `^${prefix}` } });
    this.taxCode = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  if (!this.effectiveRate) {
    this.effectiveRate = (this.rate || 0) + (this.surchargeRate || 0) + (this.cessRate || 0);
  }
  next();
});

module.exports = mongoose.model('WithholdingTax', withholdingTaxSchema);
