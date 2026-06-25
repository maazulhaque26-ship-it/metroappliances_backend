const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// Payment Approval — workflow approval records for vendor payments
const paymentApprovalSchema = new Schema({
  approvalNumber:  { type: String, unique: true },
  sourceType:      { type: String, enum: ['vendor_payment','payment_run','payment_batch','vendor_bill'], required: true },
  sourceId:        { type: ObjectId, required: true },
  sourceRef:       { type: String, trim: true },   // Payment/bill number
  vendor:          { type: ObjectId, ref: 'Vendor' },
  vendorName:      { type: String, trim: true },
  amount:          { type: Number, default: 0 },
  currency:        { type: String, default: 'INR' },
  requestedBy:     { type: ObjectId, ref: 'User', required: true },
  requestedAt:     { type: Date, default: Date.now },
  requesterName:   { type: String, trim: true },
  approvalLevel:   { type: Number, default: 1 },
  maxLevels:       { type: Number, default: 1 },
  approvers: [{
    level:       { type: Number },
    user:        { type: ObjectId, ref: 'User' },
    userName:    { type: String },
    action:      { type: String, enum: ['pending','approved','rejected','delegated'] },
    actionDate:  { type: Date },
    comments:    { type: String },
  }],
  status:          { type: String, enum: ['pending','approved','rejected','cancelled','expired'], default: 'pending' },
  rejectionReason: { type: String },
  expiresAt:       { type: Date },
  completedAt:     { type: Date },
  notes:           { type: String },
  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

paymentApprovalSchema.index({ sourceId: 1, sourceType: 1 });
paymentApprovalSchema.index({ status: 1 });
paymentApprovalSchema.index({ requestedBy: 1 });
paymentApprovalSchema.index({ 'approvers.user': 1, status: 1 });

paymentApprovalSchema.pre('validate', async function (next) {
  if (!this.approvalNumber) {
    const year = new Date().getFullYear();
    const prefix = `PAP-${year}-`;
    const count = await this.constructor.countDocuments({ approvalNumber: { $regex: `^PAP-${year}-` } });
    this.approvalNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentApproval', paymentApprovalSchema);
