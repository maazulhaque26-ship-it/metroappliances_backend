const mongoose = require('mongoose');
const { Schema } = mongoose;

const promotionRecommendationSchema = new Schema({
  promoNumber: { type: String, unique: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  cycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle' },
  currentDesignation: { type: Schema.Types.ObjectId, ref: 'Designation' },
  recommendedDesignation: { type: Schema.Types.ObjectId, ref: 'Designation' },
  currentDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  targetDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  currentCTC: { type: Number },
  proposedCTC: { type: Number },
  rationale: { type: String },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'on_hold'],
    default: 'draft',
  },
  recommendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  effectiveDate: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

promotionRecommendationSchema.pre('validate', async function (next) {
  if (!this.promoNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PromotionRecommendation').countDocuments();
    this.promoNumber = `PRM-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

promotionRecommendationSchema.index({ employee: 1, isDeleted: 1 });

module.exports = mongoose.model('PromotionRecommendation', promotionRecommendationSchema);
