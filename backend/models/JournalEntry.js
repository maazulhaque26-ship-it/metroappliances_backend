const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  journalNumber: { type: String, unique: true },
  journalType:   { type: String, required: true, enum: ['manual','automatic','recurring','reverse','adjustment','closing','opening'] },
  status:        { type: String, enum: ['draft','posted','reversed','void'], default: 'draft' },
  entryDate:     { type: Date, required: true },
  fiscalYear:    { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalYear' },
  period:        { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingPeriod' },
  reference:     { type: String, default: '' },
  narration:     { type: String, required: true, trim: true },
  totalDebit:    { type: Number, default: 0 },
  totalCredit:   { type: Number, default: 0 },
  currency:      { type: String, default: 'INR' },
  exchangeRate:  { type: Number, default: 1 },
  postedAt:      { type: Date },
  postedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversedFrom:  { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  sourceModule:  { type: String, default: '' },
  sourceId:      { type: mongoose.Schema.Types.ObjectId },
  attachments:   [{ fileName: String, fileUrl: String, uploadedAt: { type: Date, default: Date.now } }],
  tags:          [String],
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

journalEntrySchema.index({ status: 1, entryDate: -1 });
journalEntrySchema.index({ fiscalYear: 1, period: 1 });

journalEntrySchema.pre('validate', async function (next) {
  if (this.journalNumber) return next();
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  this.journalNumber = `JV-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
