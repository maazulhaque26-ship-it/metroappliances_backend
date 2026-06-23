const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Vendor Statement — point-in-time statement of account sent to/received from vendor
const statementLineSchema = new Schema({
  entryDate:    { type: Date },
  entryType:    { type: String, enum: ['opening','bill','payment','advance','debit_note','credit_note','adjustment'] },
  reference:    { type: String },
  narration:    { type: String },
  debit:        { type: Number, default: 0 },
  credit:       { type: Number, default: 0 },
  balance:      { type: Number, default: 0 },
}, { _id: false });

const vendorStatementSchema = new Schema({
  statementNumber: { type: String, unique: true },
  vendor:          { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:      { type: String, trim: true },
  fromDate:        { type: Date, required: true },
  toDate:          { type: Date, required: true },
  openingBalance:  { type: Number, default: 0 },
  totalDebits:     { type: Number, default: 0 },
  totalCredits:    { type: Number, default: 0 },
  closingBalance:  { type: Number, default: 0 },
  lines:           [statementLineSchema],
  currency:        { type: String, default: 'INR' },
  generatedAt:     { type: Date, default: Date.now },
  generatedBy:     { type: ObjectId, ref: 'User' },
  sentAt:          { type: Date },
  sentTo:          { type: String },
  reconciledAt:    { type: Date },
  reconciliationStatus: { type: String, enum: ['pending','reconciled','disputed'], default: 'pending' },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

vendorStatementSchema.index({ vendor: 1, fromDate: -1 });
vendorStatementSchema.index({ reconciliationStatus: 1 });

vendorStatementSchema.pre('validate', async function (next) {
  if (!this.statementNumber) {
    const year = new Date().getFullYear();
    const prefix = `VSTMT-${year}-`;
    const count = await this.constructor.countDocuments({ statementNumber: { $regex: `^VSTMT-${year}-` } });
    this.statementNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('VendorStatement', vendorStatementSchema);
