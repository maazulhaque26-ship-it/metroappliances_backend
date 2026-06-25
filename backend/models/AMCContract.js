const mongoose = require('mongoose');
const { Schema } = mongoose;

const visitSchema = new Schema({
  scheduledAt:  { type: Date },
  completedAt:  { type: Date },
  technicianId: { type: Schema.Types.ObjectId, ref: 'Technician' },
  serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
  notes:        { type: String },
  status:       { type: String, enum: ['scheduled', 'completed', 'cancelled', 'missed'], default: 'scheduled' },
}, { _id: true });

const amcContractSchema = new Schema({
  contractNumber: { type: String, unique: true },

  customer:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product:        { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:    { type: String },
  serialNumber:   { type: String, trim: true },

  startDate:      { type: Date, required: true },
  endDate:        { type: Date, required: true },
  durationMonths: { type: Number, required: true },

  amount:         { type: Number, required: true },
  paidAmount:     { type: Number, default: 0 },
  paymentStatus:  { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending' },
  paymentDate:    { type: Date },

  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending_activation', 'renewal_due'],
    default: 'pending_activation',
  },

  totalVisits:    { type: Number, default: 2 },
  completedVisits:{ type: Number, default: 0 },
  visits:         [visitSchema],

  inclusions:     [{ type: String }],
  exclusions:     [{ type: String }],

  renewalReminderSent: { type: Boolean, default: false },
  autoRenew:           { type: Boolean, default: false },

  activatedAt:    { type: Date },
  cancelledAt:    { type: Date },
  cancelReason:   { type: String },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

amcContractSchema.pre('save', async function (next) {
  if (this.isNew && !this.contractNumber) {
    const count = await mongoose.model('AMCContract').countDocuments();
    const year = new Date().getFullYear();
    this.contractNumber = `AMC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

amcContractSchema.index({ customer: 1, status: 1 });
amcContractSchema.index({ product: 1 });
amcContractSchema.index({ endDate: 1, status: 1 });
amcContractSchema.index({ serialNumber: 1 });

module.exports = mongoose.model('AMCContract', amcContractSchema);
