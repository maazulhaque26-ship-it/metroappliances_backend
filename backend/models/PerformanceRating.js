const mongoose = require('mongoose');
const { Schema } = mongoose;

const scoreEntrySchema = new Schema({
  category: { type: String },
  weight: { type: Number },
  score: { type: Number },
  comments: { type: String },
}, { _id: false });

const performanceRatingSchema = new Schema({
  review: { type: Schema.Types.ObjectId, ref: 'PerformanceReview', required: true },
  rater: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  raterType: { type: String, enum: ['self', 'manager', 'peer', 'hr'], default: 'manager' },
  scores: [scoreEntrySchema],
  overallScore: { type: Number },
  recommendation: { type: String },
  isSubmitted: { type: Boolean, default: false },
  submittedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

performanceRatingSchema.index({ review: 1, rater: 1 }, { unique: true });

module.exports = mongoose.model('PerformanceRating', performanceRatingSchema);
