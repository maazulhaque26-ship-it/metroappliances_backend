const mongoose = require('mongoose');

const chartOfAccountSchema = new mongoose.Schema({
  accountCode:    { type: String, unique: true },
  accountName:    { type: String, required: true, trim: true },
  accountType:    { type: String, required: true, enum: ['asset','liability','equity','revenue','expense','contra'] },
  accountNature:  { type: String, required: true, enum: ['debit','credit'] },
  accountGroup:   { type: mongoose.Schema.Types.ObjectId, ref: 'AccountGroup' },
  parentAccount:  { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', default: null },
  level:          { type: Number, default: 1 },
  postingAllowed: { type: Boolean, default: true },
  isControlAccount: { type: Boolean, default: false },
  openingBalance: { type: Number, default: 0 },
  currency:       { type: String, default: 'INR' },
  taxApplicable:  { type: Boolean, default: false },
  description:    { type: String, default: '' },
  tags:           [String],
  isActive:       { type: Boolean, default: true },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

chartOfAccountSchema.index({ accountType: 1, isActive: 1 });
chartOfAccountSchema.index({ parentAccount: 1 });

chartOfAccountSchema.pre('validate', async function (next) {
  if (this.accountCode) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.accountCode = `COA-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('ChartOfAccount', chartOfAccountSchema);
