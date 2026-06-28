const mongoose = require('mongoose');
const { Schema } = mongoose;

const trainingSessionSchema = new Schema({
  sessionCode: { type: String, unique: true },
  course: { type: Schema.Types.ObjectId, ref: 'TrainingCourse', required: true },
  title: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  location: { type: String },
  meetLink: { type: String },
  instructor: { type: String },
  maxCapacity: { type: Number },
  enrolledCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

trainingSessionSchema.pre('validate', async function (next) {
  if (!this.sessionCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('TrainingSession').countDocuments();
    this.sessionCode = `TSS-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

trainingSessionSchema.index({ course: 1, isDeleted: 1 });
trainingSessionSchema.index({ startDate: 1 });

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);
