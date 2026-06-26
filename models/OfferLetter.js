const mongoose = require('mongoose');
const { Schema } = mongoose;

const salaryBreakupSchema = new Schema(
  {
    basic: { type: Number },
    hra: { type: Number },
    travelAllowance: { type: Number },
    medicalAllowance: { type: Number },
    specialAllowance: { type: Number },
    pf: { type: Number },
    otherAllowances: { type: Number },
  },
  { _id: false }
);

const offerLetterSchema = new Schema(
  {
    offerNumber: { type: String, unique: true },
    application: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'JobOpening', required: true },
    ctc: { type: Number, required: true },
    salaryBreakup: salaryBreakupSchema,
    joiningDate: { type: Date },
    offerValidTill: { type: Date },
    designation: { type: String },
    department: { type: String },
    location: { type: String },
    probationPeriod: { type: Number, default: 90 },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'sent',
        'accepted',
        'rejected',
        'withdrawn',
        'expired',
      ],
      default: 'draft',
    },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date },
    approvedAt: { type: Date },
    remarks: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

offerLetterSchema.index({ status: 1, isDeleted: 1 });
offerLetterSchema.index({ application: 1 });
// offerNumber already has unique: true at field level — no separate index needed.

offerLetterSchema.pre('validate', async function (next) {
  if (!this.offerNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('OfferLetter').countDocuments();
    this.offerNumber = `OFR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('OfferLetter', offerLetterSchema);
