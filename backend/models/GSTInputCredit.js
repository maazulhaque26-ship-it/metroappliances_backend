const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// GST Input Credit Register — tracks ITC from vendor bills (GSTR-2B reconciliation)
const gstInputCreditSchema = new Schema({
  creditNumber:   { type: String, unique: true },
  vendor:         { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:     { type: String, trim: true },
  vendorGST:      { type: String, trim: true },
  vendorBill:     { type: ObjectId, ref: 'VendorBill', required: true },
  billNumber:     { type: String, trim: true },
  billDate:       { type: Date, required: true },
  invoiceValue:   { type: Number, default: 0 },
  igstAmount:     { type: Number, default: 0 },
  cgstAmount:     { type: Number, default: 0 },
  sgstAmount:     { type: Number, default: 0 },
  cessAmount:     { type: Number, default: 0 },
  totalTax:       { type: Number, default: 0 },
  eligibleCredit: { type: Number, default: 0 },   // Credit available to claim
  claimedCredit:  { type: Number, default: 0 },
  reverseCharge:  { type: Boolean, default: false },
  supplyType:     { type: String, enum: ['B2B','B2C','import','SEZ','exempt'], default: 'B2B' },
  gstCategory:    { type: String, enum: ['capital_goods','inputs','input_services','blocked'], default: 'inputs' },
  isBlocked:      { type: Boolean, default: false },
  blockingReason: { type: String },
  reconciliationStatus: { type: String, enum: ['pending','matched','mismatched','missing_in_gstr2b','excess'], default: 'pending' },
  gstr2bPeriod:   { type: String },   // e.g. "2026-04"
  filedPeriod:    { type: String },   // Period in which ITC was claimed
  glAccount:      { type: ObjectId, ref: 'ChartOfAccount' },
  journalEntry:   { type: ObjectId, ref: 'JournalEntry' },
  fiscalYear:     { type: ObjectId, ref: 'FiscalYear' },
  period:         { type: ObjectId, ref: 'AccountingPeriod' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

gstInputCreditSchema.index({ vendor: 1, billDate: -1 });
gstInputCreditSchema.index({ reconciliationStatus: 1 });
gstInputCreditSchema.index({ fiscalYear: 1, period: 1 });
gstInputCreditSchema.index({ vendorBill: 1 });

gstInputCreditSchema.pre('validate', async function (next) {
  if (!this.creditNumber) {
    const year = new Date().getFullYear();
    const prefix = `GSTIC-${year}-`;
    const count = await this.constructor.countDocuments({ creditNumber: { $regex: `^GSTIC-${year}-` } });
    this.creditNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('GSTInputCredit', gstInputCreditSchema);
