const mongoose = require('mongoose');
const { Schema } = mongoose;

const skillRatingSchema = new Schema(
  {
    skill: { type: String },
    rating: { type: Number },
    comments: { type: String },
  },
  { _id: false }
);

const interviewFeedbackSchema = new Schema(
  {
    interview: { type: Schema.Types.ObjectId, ref: 'Interview', required: true },
    application: { type: Schema.Types.ObjectId, ref: 'JobApplication' },
    interviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    overallRating: { type: Number, min: 1, max: 5 },
    skillRatings: [skillRatingSchema],
    strengths: { type: String },
    weaknesses: { type: String },
    comments: { type: String },
    recommendation: {
      type: String,
      enum: ['hire', 'reject', 'hold', 'next_round'],
      required: true,
    },
    isSubmitted: { type: Boolean, default: false },
    submittedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interviewFeedbackSchema.index({ interview: 1, interviewer: 1 }, { unique: true });

module.exports = mongoose.model('InterviewFeedback', interviewFeedbackSchema);
