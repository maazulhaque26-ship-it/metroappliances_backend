const mongoose = require('mongoose');
const { Schema } = mongoose;

const bgvCheckSchema = new Schema(
  {
    checkType: {
      type: String,
      enum: [
        'address',
        'criminal',
        'education',
        'employment',
        'credit',
        'reference',
        'identity',
        'other',
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    result: {
      type: String,
      enum: ['clear', 'adverse', 'unable_to_verify', 'pending'],
      default: 'pending',
    },
    remarks: { type: String },
    completedAt: { type: Date },
  },
  { _id: false }
);

const backgroundVerificationSchema = new Schema(
  {
    bgvNumber: { type: String, unique: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    application: { type: Schema.Types.ObjectId, ref: 'JobApplication' },
    vendor: { type: String },
    checks: [bgvCheckSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    overallResult: {
      type: String,
      enum: ['clear', 'adverse', 'pending'],
      default: 'pending',
    },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    reportUrl: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

backgroundVerificationSchema.index({ candidate: 1, isDeleted: 1 });
// bgvNumber already has unique: true at field level — no separate index needed.

backgroundVerificationSchema.pre('validate', async function (next) {
  if (!this.bgvNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('BackgroundVerification').countDocuments();
    this.bgvNumber = `BGV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BackgroundVerification', backgroundVerificationSchema);
