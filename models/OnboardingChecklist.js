const mongoose = require('mongoose');
const { Schema } = mongoose;

const onboardingTaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['document', 'system_access', 'training', 'equipment', 'orientation', 'other'],
      default: 'other',
    },
    dueDate: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { _id: false }
);

const onboardingChecklistSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    application: { type: Schema.Types.ObjectId, ref: 'JobApplication' },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    joiningDate: { type: Date },
    tasks: [onboardingTaskSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    completionPercentage: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

onboardingChecklistSchema.index({ candidate: 1, isDeleted: 1 });

module.exports = mongoose.model('OnboardingChecklist', onboardingChecklistSchema);
