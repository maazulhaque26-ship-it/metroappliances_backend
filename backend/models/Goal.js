const mongoose = require('mongoose');
const { Schema } = mongoose;

const goalSchema = new Schema({
  goalNumber: { type: String, unique: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  cycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle' },
  category: { type: Schema.Types.ObjectId, ref: 'GoalCategory' },
  title: { type: String, required: true },
  description: { type: String },
  targetDate: { type: Date },
  weightage: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'active', 'achieved', 'partially_achieved', 'not_achieved', 'cancelled'],
    default: 'draft',
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  startDate: { type: Date },
  completedDate: { type: Date },
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['individual', 'team', 'organizational'], default: 'individual' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

goalSchema.pre('validate', async function (next) {
  if (!this.goalNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Goal').countDocuments();
    this.goalNumber = `GOL-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

goalSchema.index({ employee: 1, isDeleted: 1 });
goalSchema.index({ cycle: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
