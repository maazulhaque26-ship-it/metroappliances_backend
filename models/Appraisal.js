const mongoose = require('mongoose');
const { Schema } = mongoose;

const appraisalSchema = new Schema({
  appraisalNumber: { type: String, unique: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  cycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true },
  review: { type: Schema.Types.ObjectId, ref: 'PerformanceReview' },
  finalRating: {
    type: String,
    enum: ['outstanding', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory'],
  },
  finalScore: { type: Number },
  increment: { type: Number },
  incrementType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  newCTC: { type: Number },
  effectiveDate: { type: Date },
  remarks: { type: String },
  status: { type: String, enum: ['draft', 'approved', 'communicated'], default: 'draft' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

appraisalSchema.pre('validate', async function (next) {
  if (!this.appraisalNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Appraisal').countDocuments();
    this.appraisalNumber = `APR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

appraisalSchema.index({ employee: 1, cycle: 1 });

module.exports = mongoose.model('Appraisal', appraisalSchema);
