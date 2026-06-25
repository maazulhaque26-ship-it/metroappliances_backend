const mongoose = require('mongoose');
const { Schema } = mongoose;

const transferSchema = new Schema({
  fromCustomer: { type: Schema.Types.ObjectId, ref: 'User' },
  toCustomer:   { type: Schema.Types.ObjectId, ref: 'User' },
  transferredAt:{ type: Date, default: Date.now },
  note:         { type: String },
}, { _id: true });

const claimSchema = new Schema({
  serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
  claimedAt:    { type: Date, default: Date.now },
  description:  { type: String },
  status:       { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  resolution:   { type: String },
}, { _id: true });

const warrantyCardSchema = new Schema({
  warrantyNumber: { type: String, unique: true },

  serialNumber:   { type: String, required: true, trim: true },
  serialRef:      { type: Schema.Types.ObjectId, ref: 'SerialNumber' },
  product:        { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:    { type: String },
  customer:       { type: Schema.Types.ObjectId, ref: 'User', required: true },

  warrantyType:   {
    type: String,
    enum: ['manufacturer', 'extended', 'dealer', 'amc'],
    required: true,
  },

  startDate:      { type: Date, required: true },
  endDate:        { type: Date, required: true },
  durationMonths: { type: Number },

  purchaseDate:   { type: Date },
  invoiceNumber:  { type: String, trim: true },
  purchaseAmount: { type: Number },
  dealerName:     { type: String },

  status: {
    type: String,
    enum: ['active', 'expired', 'void', 'transferred', 'pending_activation'],
    default: 'pending_activation',
  },

  inclusions: [{ type: String }],
  exclusions: [{ type: String }],

  maxClaims:      { type: Number, default: 0 },  // 0 = unlimited
  claimsUsed:     { type: Number, default: 0 },

  transferHistory: [transferSchema],
  claims:          [claimSchema],

  activatedAt:    { type: Date },
  activatedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

warrantyCardSchema.pre('save', async function (next) {
  if (this.isNew && !this.warrantyNumber) {
    const count = await mongoose.model('WarrantyCard').countDocuments();
    const year = new Date().getFullYear();
    this.warrantyNumber = `WC-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  // Auto-set status based on dates
  if (this.endDate && this.status === 'active' && new Date() > this.endDate) {
    this.status = 'expired';
  }
  next();
});

warrantyCardSchema.index({ serialNumber: 1 });
warrantyCardSchema.index({ customer: 1, status: 1 });
warrantyCardSchema.index({ product: 1 });
warrantyCardSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model('WarrantyCard', warrantyCardSchema);
