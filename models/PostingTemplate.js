const mongoose = require('mongoose');

const postingTemplateSchema = new mongoose.Schema({
  templateCode: { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  journalType:  { type: String, enum: ['manual','automatic','recurring','adjustment','closing','opening'], default: 'manual' },
  lines: [{
    lineNumber:   { type: Number },
    account:      { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
    debitOrCredit:{ type: String, enum: ['debit','credit'], required: true },
    percentage:   { type: Number, default: 0 },
    narration:    { type: String, default: '' },
    costCenter:   { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  }],
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

postingTemplateSchema.pre('validate', async function (next) {
  if (this.templateCode) return next();
  const count = await this.constructor.countDocuments();
  this.templateCode = `PT-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('PostingTemplate', postingTemplateSchema);
