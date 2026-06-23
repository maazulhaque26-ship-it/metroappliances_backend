const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const customerCreditLimitSchema = new Schema({
  customer:      { type: ObjectId, ref: 'User', required: true, unique: true },
  customerName:  { type: String, trim: true },
  creditLimit:   { type: Number, required: true, default: 0, min: 0 },
  usedCredit:    { type: Number, default: 0 },
  availableCredit:{ type: Number, default: 0 },
  currency:      { type: String, default: 'INR' },
  riskRating:    { type: String, enum: ['low','medium','high','blocked'], default: 'medium' },
  isBlocked:     { type: Boolean, default: false },
  blockReason:   { type: String, trim: true },
  blockedAt:     { type: Date },
  blockedBy:     { type: ObjectId, ref: 'User' },
  autoHold:      { type: Boolean, default: false },
  holdThreshold: { type: Number, default: 90 },
  creditTerms:   { type: String, enum: ['net7','net15','net30','net45','net60','net90','immediate','custom'], default: 'net30' },
  reviewDate:    { type: Date },
  lastReviewDate:{ type: Date },
  approvedBy:    { type: ObjectId, ref: 'User' },
  approvedAt:    { type: Date },
  notes:         { type: String },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

customerCreditLimitSchema.index({ customer: 1, isDeleted: 1 });
customerCreditLimitSchema.index({ riskRating: 1 });
customerCreditLimitSchema.index({ isBlocked: 1 });

module.exports = mongoose.model('CustomerCreditLimit', customerCreditLimitSchema);
