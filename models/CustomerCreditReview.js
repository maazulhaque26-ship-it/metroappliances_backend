const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const customerCreditReviewSchema = new Schema({
  reviewNumber:   { type: String, unique: true },
  customer:       { type: ObjectId, ref: 'User', required: true },
  customerName:   { type: String, trim: true },
  creditLimit:    { type: ObjectId, ref: 'CustomerCreditLimit' },
  previousLimit:  { type: Number, default: 0 },
  proposedLimit:  { type: Number, required: true, min: 0 },
  approvedLimit:  { type: Number, default: 0 },
  reviewDate:     { type: Date, required: true, default: Date.now },
  reviewType:     { type: String, enum: ['periodic','triggered','upgrade','downgrade','initial','blocked_review'], default: 'periodic' },
  triggerReason:  { type: String, trim: true },
  riskRatingChange:{ type: String, enum: ['low','medium','high','blocked'] },
  status:         { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  requestedBy:    { type: ObjectId, ref: 'User', required: true },
  approvedBy:     { type: ObjectId, ref: 'User' },
  approvedAt:     { type: Date },
  rejectionReason:{ type: String },
  notes:          { type: String },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

customerCreditReviewSchema.index({ customer: 1, isDeleted: 1 });
customerCreditReviewSchema.index({ status: 1 });
customerCreditReviewSchema.index({ reviewDate: -1 });

customerCreditReviewSchema.pre('validate', async function (next) {
  if (!this.reviewNumber) {
    const yr = new Date().getFullYear();
    const prefix = `CREV-${yr}-`;
    const count = await this.constructor.countDocuments({ reviewNumber: { $regex: `^${prefix}` } });
    this.reviewNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CustomerCreditReview', customerCreditReviewSchema);
