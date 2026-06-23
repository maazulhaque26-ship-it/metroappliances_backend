const mongoose = require('mongoose');

const pettyCashSchema = new mongoose.Schema({
  fundNumber:    { type: String, unique: true },
  fundName:      { type: String, required: true, trim: true },
  cashAccount:   { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount' },
  custodian:     { type: String, required: true, trim: true },
  department:    { type: String, trim: true },
  currency:      { type: String, default: 'INR', uppercase: true },
  floatAmount:   { type: Number, required: true, default: 0 },
  currentBalance:{ type: Number, default: 0 },
  replenishAt:   { type: Number, default: 0 },
  status:        { type: String, enum: ['active','suspended','closed'], default: 'active' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

pettyCashSchema.pre('validate', async function (next) {
  if (this.fundNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.fundNumber = `PC-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

pettyCashSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('PettyCash', pettyCashSchema);
