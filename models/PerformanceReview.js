const mongoose = require('mongoose');
const { Schema } = mongoose;

const performanceReviewSchema = new Schema({
  reviewNumber: { type: String, unique: true },
  cycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewType: { type: String, enum: ['self', 'manager', 'peer', '360'], default: 'manager' },
  status: {
    type: String,
    enum: ['draft', 'self_review', 'manager_review', 'calibration', 'completed'],
    default: 'draft',
  },
  selfScore: { type: Number, min: 0, max: 100 },
  managerScore: { type: Number, min: 0, max: 100 },
  finalScore: { type: Number, min: 0, max: 100 },
  overallRating: {
    type: String,
    enum: ['outstanding', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory'],
  },
  strengthsNotes: { type: String },
  improvementNotes: { type: String },
  developmentPlan: { type: String },
  submittedAt: { type: Date },
  completedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

performanceReviewSchema.pre('validate', async function (next) {
  if (!this.reviewNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PerformanceReview').countDocuments();
    this.reviewNumber = `PRV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

performanceReviewSchema.index({ cycle: 1, employee: 1 });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
