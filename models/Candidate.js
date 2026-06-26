const mongoose = require('mongoose');
const { Schema } = mongoose;

const educationSchema = new Schema(
  {
    degree: { type: String },
    field: { type: String },
    institution: { type: String },
    year: { type: Number },
    percentage: { type: Number },
  },
  { _id: false }
);

const candidateSchema = new Schema(
  {
    candidateNumber: { type: String, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    currentCompany: { type: String },
    currentDesignation: { type: String },
    currentCTC: { type: Number, default: 0 },
    expectedCTC: { type: Number, default: 0 },
    noticePeriod: { type: Number, default: 0 },
    totalExperience: { type: Number, default: 0 },
    relevantExperience: { type: Number, default: 0 },
    skills: [{ type: String }],
    education: [educationSchema],
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
      default: 'direct',
    },
    referredBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    agency: { type: Schema.Types.ObjectId, ref: 'RecruitmentAgency' },
    linkedIn: { type: String },
    portfolio: { type: String },
    resumeUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'hired', 'rejected', 'blacklisted', 'on_hold'],
      default: 'active',
    },
    talentPools: [{ type: String }],
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    dateOfBirth: { type: Date },
    currentCity: { type: String },
    preferredLocations: [{ type: String }],
    notes: { type: String },
    convertedEmployee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

candidateSchema.index({ email: 1 });
candidateSchema.index({ status: 1, isDeleted: 1 });
// candidateNumber already has unique: true at field level — no separate index needed.

candidateSchema.pre('validate', async function (next) {
  if (!this.candidateNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Candidate').countDocuments();
    this.candidateNumber = `CND-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema);
