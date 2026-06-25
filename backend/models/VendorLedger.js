const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Vendor Ledger — running ledger for AP transactions per vendor
const vendorLedgerSchema = new Schema({
  vendor:       { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:   { type: String, trim: true },
  entryDate:    { type: Date, required: true },
  entryType:    { type: String, enum: ['bill','payment','advance','debit_note','credit_note','adjustment','opening'], required: true },
  reference:    { type: String, trim: true },   // VB number, VP number, etc.
  sourceId:     { type: ObjectId },
  sourceModel:  { type: String, enum: ['VendorBill','VendorPayment','VendorAdvance','DebitNote','APCreditNote','JournalEntry'] },
  narration:    { type: String, trim: true },
  debit:        { type: Number, default: 0 },   // Amount owed TO vendor (AP increase)
  credit:       { type: Number, default: 0 },   // Amount paid/reduced (AP decrease)
  runningBalance: { type: Number, default: 0 }, // Positive = vendor owes us, Negative = we owe vendor
  currency:     { type: String, default: 'INR' },
  fiscalYear:   { type: ObjectId, ref: 'FiscalYear' },
  period:       { type: ObjectId, ref: 'AccountingPeriod' },
  journalEntry: { type: ObjectId, ref: 'JournalEntry' },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

vendorLedgerSchema.index({ vendor: 1, entryDate: -1 });
vendorLedgerSchema.index({ vendor: 1, isDeleted: 1 });
vendorLedgerSchema.index({ sourceId: 1, sourceModel: 1 });
vendorLedgerSchema.index({ fiscalYear: 1, period: 1 });

module.exports = mongoose.model('VendorLedger', vendorLedgerSchema);
