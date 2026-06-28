const mongoose = require('mongoose');
const { Schema } = mongoose;

const certificationTrackingSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  certificationName: { type: String, required: true },
  issuingAuthority: { type: String },
  certificationNumber: { type: String },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  documentUrl: { type: String },
  course: { type: Schema.Types.ObjectId, ref: 'TrainingCourse' },
  status: {
    type: String,
    enum: ['active', 'expiring_soon', 'expired', 'revoked'],
    default: 'active',
  },
  reminderSent: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

certificationTrackingSchema.index({ employee: 1, isDeleted: 1 });
certificationTrackingSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('CertificationTracking', certificationTrackingSchema);
