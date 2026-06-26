const mongoose = require('mongoose');
const { Schema } = mongoose;

const stageHistorySchema = new Schema(
  {
    stage: { type: String },
    status: { type: String },
    movedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    movedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { _id: false }
);

const jobApplicationSchema = new Schema(
  {
    applicationNumber: { type: String, unique: true },
    job: { type: Schema.Types.ObjectId, ref: 'JobOpening', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    status: {
      type: String,
      enum: [
        'applied',
        'screening',
        'shortlisted',
        'interview',
        'technical_interview',
        'hr_interview',
        'offer',
        'hired',
        'rejected',
        'withdrawn',
        'on_hold',
      ],
      default: 'applied',
    },
    currentStage: { type: String, default: 'Applied' },
    stageHistory: [stageHistorySchema],
    source: {
      type: String,
      enum: [
        'job_portal',
        'referral',
        'walk_in',
        'agency',
        'social_media',
        'campus',
        'internal',
        'direct',
        'other',
      ],
    },
    coverLetter: { type: String },
    resumeUrl: { type: String },
    expectedCTC: { type: Number },
    noticePeriod: { type: Number },
    rating: { type: Number, min: 1, max: 5 },
    tags: [{ type: String }],
    appliedAt: { type: Date, default: Date.now },
    shortlistedAt: { type: Date },
    offeredAt: { type: Date },
    hiredAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
jobApplicationSchema.index({ status: 1, isDeleted: 1 });
// applicationNumber already has unique: true at field level — no separate index needed.

jobApplicationSchema.pre('validate', async function (next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('JobApplication').countDocuments();
    this.applicationNumber = `APP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
