const mongoose = require('mongoose');
const { Schema } = mongoose;

const trainingCourseSchema = new Schema({
  courseCode: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  duration: { type: Number, default: 0 },
  mode: { type: String, enum: ['online', 'offline', 'blended'], default: 'online' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  skills: [{ type: String }],
  instructor: { type: String },
  maxCapacity: { type: Number },
  price: { type: Number, default: 0 },
  prerequisites: [{ type: Schema.Types.ObjectId, ref: 'TrainingCourse' }],
  isMandatory: { type: Boolean, default: false },
  certificateOnCompletion: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

trainingCourseSchema.pre('validate', async function (next) {
  if (!this.courseCode) {
    const count = await mongoose.model('TrainingCourse').countDocuments();
    this.courseCode = `CRS-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

trainingCourseSchema.index({ category: 1, isDeleted: 1 });

module.exports = mongoose.model('TrainingCourse', trainingCourseSchema);
