const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const receiptBatchSchema = new Schema({
  batchNumber:   { type: String, unique: true },
  batchDate:     { type: Date, required: true, default: Date.now },
  batchType:     { type: String, enum: ['daily','manual','bank_reconciliation','bulk_upload'], default: 'daily' },
  description:   { type: String, trim: true },
  receipts:      [{ type: ObjectId, ref: 'CustomerReceipt' }],
  totalAmount:   { type: Number, default: 0 },
  receiptCount:  { type: Number, default: 0 },
  currency:      { type: String, default: 'INR' },
  bankAccount:   { type: ObjectId, ref: 'ChartOfAccount' },
  status:        { type: String, enum: ['draft','processing','posted','reconciled','cancelled'], default: 'draft' },
  processedBy:   { type: ObjectId, ref: 'User' },
  processedAt:   { type: Date },
  postedAt:      { type: Date },
  journalEntry:  { type: ObjectId, ref: 'JournalEntry' },
  notes:         { type: String },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

receiptBatchSchema.index({ batchDate: -1 });
receiptBatchSchema.index({ status: 1 });

receiptBatchSchema.pre('validate', async function (next) {
  if (!this.batchNumber) {
    const yr = new Date().getFullYear();
    const prefix = `RB-${yr}-`;
    const count = await this.constructor.countDocuments({ batchNumber: { $regex: `^${prefix}` } });
    this.batchNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ReceiptBatch', receiptBatchSchema);
