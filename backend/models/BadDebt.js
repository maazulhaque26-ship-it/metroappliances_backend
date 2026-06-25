const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const badDebtSchema = new Schema({
  badDebtNumber:    { type: String, unique: true },
  customer:         { type: ObjectId, ref: 'User', required: true },
  customerName:     { type: String, trim: true },
  customerInvoice:  { type: ObjectId, ref: 'CustomerInvoice', required: true },
  invoiceNumber:    { type: String, trim: true },
  originalAmount:   { type: Number, required: true, min: 0 },
  badDebtAmount:    { type: Number, required: true, min: 0 },
  reason:           { type: String, enum: ['uncollectable','bankruptcy','dispute','aged_debt','write_off_policy','customer_closure','fraud'], required: true },
  provisionDate:    { type: Date, default: Date.now },
  writeOffDate:     { type: Date },
  status:           { type: String, enum: ['pending_approval','approved','posted','reversed','recovered'], default: 'pending_approval' },
  badDebtAccount:   { type: ObjectId, ref: 'ChartOfAccount' },
  arAccount:        { type: ObjectId, ref: 'ChartOfAccount' },
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  approvedBy:       { type: ObjectId, ref: 'User' },
  approvedAt:       { type: Date },
  recoveredAmount:  { type: Number, default: 0 },
  recoveredAt:      { type: Date },
  notes:            { type: String },
  createdBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

badDebtSchema.index({ customer: 1, isDeleted: 1 });
badDebtSchema.index({ status: 1 });
badDebtSchema.index({ customerInvoice: 1 });

badDebtSchema.pre('validate', async function (next) {
  if (!this.badDebtNumber) {
    const yr = new Date().getFullYear();
    const prefix = `BD-${yr}-`;
    const count = await this.constructor.countDocuments({ badDebtNumber: { $regex: `^${prefix}` } });
    this.badDebtNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BadDebt', badDebtSchema);
