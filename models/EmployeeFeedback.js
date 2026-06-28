const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeFeedbackSchema = new Schema({
  feedbackNumber: { type: String, unique: true },
  fromEmployee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  toEmployee: { type: Schema.Types.ObjectId, ref: 'Employee' },
  type: {
    type: String,
    enum: ['appreciation', 'improvement', '360_review', 'general'],
    default: 'general',
  },
  subject: { type: String },
  message: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  status: {
    type: String,
    enum: ['submitted', 'acknowledged', 'resolved'],
    default: 'submitted',
  },
  acknowledgedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

employeeFeedbackSchema.pre('validate', async function (next) {
  if (!this.feedbackNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('EmployeeFeedback').countDocuments();
    this.feedbackNumber = `FBK-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

employeeFeedbackSchema.index({ toEmployee: 1, isDeleted: 1 });

module.exports = mongoose.model('EmployeeFeedback', employeeFeedbackSchema);
