const mongoose = require('mongoose');
const { Schema } = mongoose;

const performanceCycleSchema = new Schema({
  cycleCode: { type: String, unique: true },
  name: { type: String, required: true },
  cycleType: { type: String, enum: ['annual', 'quarterly', 'half_yearly'], default: 'annual' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  year: { type: Number },
  quarter: { type: Number, min: 1, max: 4 },
  status: { type: String, enum: ['draft', 'active', 'review_phase', 'closed'], default: 'draft' },
  goalWeightage: { type: Number, default: 40 },
  kpiWeightage: { type: Number, default: 60 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

performanceCycleSchema.pre('validate', async function (next) {
  if (!this.cycleCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PerformanceCycle').countDocuments();
    this.cycleCode = `PC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

performanceCycleSchema.index({ status: 1, isDeleted: 1 });
performanceCycleSchema.index({ year: 1 });

module.exports = mongoose.model('PerformanceCycle', performanceCycleSchema);
