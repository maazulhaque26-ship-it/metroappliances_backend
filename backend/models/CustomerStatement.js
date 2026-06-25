const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const statementLineSchema = new Schema({
  entryDate:      { type: Date },
  reference:      { type: String },
  narration:      { type: String },
  debit:          { type: Number, default: 0 },
  credit:         { type: Number, default: 0 },
  runningBalance: { type: Number, default: 0 },
}, { _id: false });

const customerStatementSchema = new Schema({
  statementNumber:       { type: String, unique: true },
  customer:              { type: ObjectId, ref: 'User', required: true },
  customerName:          { type: String, trim: true },
  customerEmail:         { type: String, trim: true },
  fromDate:              { type: Date, required: true },
  toDate:                { type: Date, required: true },
  openingBalance:        { type: Number, default: 0 },
  closingBalance:        { type: Number, default: 0 },
  totalDebits:           { type: Number, default: 0 },
  totalCredits:          { type: Number, default: 0 },
  statementLines:        [statementLineSchema],
  currency:              { type: String, default: 'INR' },
  reconciliationStatus:  { type: String, enum: ['pending','reconciled','disputed'], default: 'pending' },
  generatedBy:           { type: ObjectId, ref: 'User' },
  sentAt:                { type: Date },
  isDeleted:             { type: Boolean, default: false },
}, { timestamps: true });

customerStatementSchema.index({ customer: 1, fromDate: -1 });
customerStatementSchema.index({ customer: 1, isDeleted: 1 });

customerStatementSchema.pre('validate', async function (next) {
  if (!this.statementNumber) {
    const yr = new Date().getFullYear();
    const prefix = `CSTMT-${yr}-`;
    const count = await this.constructor.countDocuments({ statementNumber: { $regex: `^${prefix}` } });
    this.statementNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CustomerStatement', customerStatementSchema);
