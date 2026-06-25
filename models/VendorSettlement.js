const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Vendor Settlement — net settlement of outstanding bills vs. credits
const settlementLineSchema = new Schema({
  sourceType:   { type: String, enum: ['vendor_bill','debit_note','credit_note','advance','payment'] },
  sourceId:     { type: ObjectId },
  sourceRef:    { type: String },
  amount:       { type: Number, default: 0 },
  settledAmount:{ type: Number, default: 0 },
  balance:      { type: Number, default: 0 },
}, { _id: true });

const vendorSettlementSchema = new Schema({
  settlementNumber: { type: String, unique: true },
  vendor:           { type: ObjectId, ref: 'Vendor', required: true },
  vendorName:       { type: String, trim: true },
  settlementDate:   { type: Date, required: true, default: Date.now },
  totalDebits:      { type: Number, default: 0 },   // Bills + debit notes
  totalCredits:     { type: Number, default: 0 },   // Credit notes + advances
  netPayable:       { type: Number, default: 0 },   // totalDebits - totalCredits
  settlementLines:  [settlementLineSchema],
  status:           { type: String, enum: ['draft','approved','posted','cancelled'], default: 'draft' },
  journalEntry:     { type: ObjectId, ref: 'JournalEntry' },
  glPosted:         { type: Boolean, default: false },
  approvedBy:       { type: ObjectId, ref: 'User' },
  approvedAt:       { type: Date },
  notes:            { type: String },
  createdBy:        { type: ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

vendorSettlementSchema.index({ vendor: 1, settlementDate: -1 });
vendorSettlementSchema.index({ status: 1, isDeleted: 1 });

vendorSettlementSchema.pre('validate', async function (next) {
  if (!this.settlementNumber) {
    const year = new Date().getFullYear();
    const prefix = `VS-${year}-`;
    const count = await this.constructor.countDocuments({ settlementNumber: { $regex: `^VS-${year}-` } });
    this.settlementNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('VendorSettlement', vendorSettlementSchema);
