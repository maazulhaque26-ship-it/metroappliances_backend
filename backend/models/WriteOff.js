const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const writeOffSchema = new Schema({
  writeOffNumber:   { type: String, unique: true },
  customer:         { type: ObjectId, ref: 'User', required: true },
  customerName:     { type: String, trim: true },
  customerInvoice:  { type: ObjectId, ref: 'CustomerInvoice' },
  invoiceNumber:    { type: String, trim: true },
  writeOffDate:     { type: Date, required: true, default: Date.now },
  writeOffAmount:   { type: Number, required: true, min: 0 },
  reason:           { type: String, required: true, trim: true },
  writeOffType:     { type: String, enum: ['discount','bad_debt','adjustment','settlement','rounding'], default: 'bad_debt' },
  writeOffAccount:  { type: ObjectId, ref: 'ChartOfAccount' },
  arAccount:        { type: ObjectId, ref: 'ChartOfAccount' },
  status:           { type: String, enum: ['draft','approved','posted','reversed'], default: 'draft' },
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  approvedBy:       { type: ObjectId, ref: 'User' },
  approvedAt:       { type: Date },
  reversedAt:       { type: Date },
  reversalReason:   { type: String },
  notes:            { type: String },
  createdBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

writeOffSchema.index({ customer: 1, isDeleted: 1 });
writeOffSchema.index({ status: 1 });
writeOffSchema.index({ customerInvoice: 1 });

writeOffSchema.pre('validate', async function (next) {
  if (!this.writeOffNumber) {
    const yr = new Date().getFullYear();
    const prefix = `WO-${yr}-`;
    const count = await this.constructor.countDocuments({ writeOffNumber: { $regex: `^${prefix}` } });
    this.writeOffNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('WriteOff', writeOffSchema);
