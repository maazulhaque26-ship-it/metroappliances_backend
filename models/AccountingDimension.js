const mongoose = require('mongoose');

const accountingDimensionSchema = new mongoose.Schema({
  dimensionCode: { type: String, unique: true },
  name:          { type: String, required: true, trim: true },
  dimensionType: { type: String, required: true, enum: ['cost_center','profit_center','project','department','region','product','customer','vendor','custom'] },
  values: [{
    code:  { type: String, required: true },
    label: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  }],
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

accountingDimensionSchema.pre('validate', async function (next) {
  if (this.dimensionCode) return next();
  const count = await this.constructor.countDocuments();
  this.dimensionCode = `DIM-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('AccountingDimension', accountingDimensionSchema);
