const mongoose = require('mongoose');

const postingRuleSchema = new mongoose.Schema({
  ruleCode:     { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  sourceModule: { type: String, required: true, enum: ['sales','purchase','inventory','manufacturing','warehouse','service','dealer','installation','maintenance','payroll','manual'] },
  eventType:    { type: String, required: true },
  debitAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  creditAccount:{ type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  description:  { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

postingRuleSchema.pre('validate', async function (next) {
  if (this.ruleCode) return next();
  const count = await this.constructor.countDocuments();
  this.ruleCode = `PR-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('PostingRule', postingRuleSchema);
