const mongoose = require('mongoose');
const { Schema } = mongoose;

const kpiReviewSchema = new Schema({
  kpi: { type: Schema.Types.ObjectId, ref: 'KPI', required: true },
  cycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  targetValue: { type: Number },
  actualValue: { type: Number },
  achievementPercent: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5 },
  comments: { type: String },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

kpiReviewSchema.index({ kpi: 1, cycle: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('KPIReview', kpiReviewSchema);
