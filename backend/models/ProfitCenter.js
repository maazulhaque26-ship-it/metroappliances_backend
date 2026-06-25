const mongoose = require('mongoose');

const profitCenterSchema = new mongoose.Schema({
  centerCode:  { type: String, unique: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  manager:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  segment:     { type: String, default: '' },
  region:      { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

profitCenterSchema.pre('validate', async function (next) {
  if (this.centerCode) return next();
  const count = await this.constructor.countDocuments();
  this.centerCode = `PC-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('ProfitCenter', profitCenterSchema);
