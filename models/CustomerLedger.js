const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const customerLedgerSchema = new Schema({
  customer:       { type: ObjectId, ref: 'User', required: true },
  customerName:   { type: String, trim: true },
  entryDate:      { type: Date, required: true },
  entryType:      { type: String, enum: ['invoice','receipt','advance','credit_note','debit_note','write_off','adjustment','opening','bad_debt'], required: true },
  reference:      { type: String, trim: true },
  sourceId:       { type: ObjectId },
  sourceModel:    { type: String, enum: ['CustomerInvoice','CustomerReceipt','CustomerAdvance','WriteOff','BadDebt','JournalEntry','Order'] },
  narration:      { type: String, trim: true },
  debit:          { type: Number, default: 0 },
  credit:         { type: Number, default: 0 },
  runningBalance: { type: Number, default: 0 },
  currency:       { type: String, default: 'INR' },
  fiscalYear:     { type: ObjectId, ref: 'FiscalYear' },
  period:         { type: ObjectId, ref: 'AccountingPeriod' },
  journalEntry:   { type: ObjectId, ref: 'JournalEntry' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

customerLedgerSchema.index({ customer: 1, entryDate: -1 });
customerLedgerSchema.index({ customer: 1, isDeleted: 1 });
customerLedgerSchema.index({ sourceId: 1, sourceModel: 1 });
customerLedgerSchema.index({ fiscalYear: 1, period: 1 });

module.exports = mongoose.model('CustomerLedger', customerLedgerSchema);
