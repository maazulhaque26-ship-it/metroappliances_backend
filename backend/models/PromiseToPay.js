const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const promiseToPaySchema = new Schema({
  ptpNumber:          { type: String, unique: true },
  customer:           { type: ObjectId, ref: 'User', required: true },
  customerName:       { type: String, trim: true },
  customerInvoice:    { type: ObjectId, ref: 'CustomerInvoice' },
  invoiceNumber:      { type: String, trim: true },
  collectionActivity: { type: ObjectId, ref: 'CollectionActivity' },
  promisedDate:       { type: Date, required: true },
  promisedAmount:     { type: Number, required: true, min: 0 },
  totalDueAmount:     { type: Number, default: 0 },
  status:             { type: String, enum: ['active','fulfilled','broken','partial','cancelled'], default: 'active' },
  followUpDate:       { type: Date },
  notes:              { type: String, trim: true },
  fulfilledAt:        { type: Date },
  fulfilledAmount:    { type: Number, default: 0 },
  brokenReason:       { type: String, trim: true },
  collectionOfficer:  { type: ObjectId, ref: 'User' },
  isDeleted:          { type: Boolean, default: false },
}, { timestamps: true });

promiseToPaySchema.index({ customer: 1, isDeleted: 1 });
promiseToPaySchema.index({ status: 1 });
promiseToPaySchema.index({ promisedDate: 1 });

promiseToPaySchema.pre('validate', async function (next) {
  if (!this.ptpNumber) {
    const yr = new Date().getFullYear();
    const prefix = `PTP-${yr}-`;
    const count = await this.constructor.countDocuments({ ptpNumber: { $regex: `^${prefix}` } });
    this.ptpNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PromiseToPay', promiseToPaySchema);
