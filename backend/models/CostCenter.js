const mongoose = require('mongoose');

const costCenterSchema = new mongoose.Schema({
  centerCode:   { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  parentCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter', default: null },
  manager:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department:   { type: String, default: '' },
  factory:      { type: String, default: '' },
  budget:       { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

costCenterSchema.pre('validate', async function (next) {
  if (this.centerCode) return next();
  const count = await this.constructor.countDocuments();
  this.centerCode = `CC-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('CostCenter', costCenterSchema);
