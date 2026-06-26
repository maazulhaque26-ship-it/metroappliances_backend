const mongoose = require('mongoose');
const { Schema } = mongoose;

const jobOpeningSchema = new Schema(
  {
    jobNumber: { type: String, unique: true },
    title: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    designation: { type: Schema.Types.ObjectId, ref: 'Designation' },
    jobType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship', 'freelance'],
      default: 'full_time',
    },
    workMode: {
      type: String,
      enum: ['on_site', 'remote', 'hybrid'],
      default: 'on_site',
    },
    location: { type: String },
    experienceMin: { type: Number, default: 0 },
    experienceMax: { type: Number },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    skills: [{ type: String }],
    description: { type: String },
    requirements: { type: String },
    benefits: { type: String },
    openings: { type: Number, default: 1 },
    filledCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'open', 'on_hold', 'closed', 'cancelled'],
      default: 'draft',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    expiryDate: { type: Date },
    postedDate: { type: Date },
    pipeline: { type: Schema.Types.ObjectId, ref: 'RecruitmentPipeline' },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedDate: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobOpeningSchema.index({ status: 1, isDeleted: 1 });
jobOpeningSchema.index({ department: 1, isDeleted: 1 });
// jobNumber already has unique: true at field level — no separate index needed.

jobOpeningSchema.pre('validate', async function (next) {
  if (!this.jobNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('JobOpening').countDocuments();
    this.jobNumber = `JOB-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('JobOpening', jobOpeningSchema);
