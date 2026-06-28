const mongoose = require('mongoose');
const { Schema } = mongoose;

const learningPathCourseSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'TrainingCourse' },
  order: { type: Number },
  isMandatory: { type: Boolean, default: true },
}, { _id: false });

const learningPathSchema = new Schema({
  pathCode: { type: String, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  targetRole: { type: Schema.Types.ObjectId, ref: 'Designation' },
  courses: [learningPathCourseSchema],
  estimatedDuration: { type: Number, default: 0 },
  skills: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

learningPathSchema.pre('validate', async function (next) {
  if (!this.pathCode) {
    const count = await mongoose.model('LearningPath').countDocuments();
    this.pathCode = `LP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('LearningPath', learningPathSchema);
