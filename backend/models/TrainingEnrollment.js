const mongoose = require('mongoose');
const { Schema } = mongoose;

const trainingEnrollmentSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: 'TrainingSession', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'TrainingCourse' },
  enrolledAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['enrolled', 'attending', 'completed', 'cancelled', 'failed'],
    default: 'enrolled',
  },
  completionDate: { type: Date },
  score: { type: Number },
  feedback: { type: String },
  certificateIssued: { type: Boolean, default: false },
  certificateUrl: { type: String },
  attendancePercent: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

trainingEnrollmentSchema.index({ session: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);
