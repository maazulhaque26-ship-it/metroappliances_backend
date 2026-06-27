const mongoose = require('mongoose');
const { Schema } = mongoose;

const biKPITargetSchema = new Schema({
  targetCode:    { type: String, unique: true },
  kpiName:       { type: String, required: true, trim: true },
  period:        { type: String, required: true },
  periodType:    { type: String, enum: ['monthly','quarterly','annual'], default: 'monthly' },
  targetValue:   { type: Number, required: true },
  stretchTarget: Number,
  minimumTarget: Number,
  unit:          { type: String, default: '' },
  module:        { type: String, default: 'enterprise' },
  department:    String,
  isActive:      { type: Boolean, default: true },
  notes:         String,
  setBy:         { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

biKPITargetSchema.index({ kpiName: 1, period: 1, module: 1 }, { unique: true });

biKPITargetSchema.pre('validate', async function (next) {
  if (!this.targetCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('BIKPITarget').countDocuments({ targetCode: new RegExp(`^BIT-${y}-`) });
    this.targetCode = `BIT-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BIKPITarget', biKPITargetSchema);
