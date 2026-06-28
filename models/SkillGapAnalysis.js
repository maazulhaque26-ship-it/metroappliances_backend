const mongoose = require('mongoose');
const { Schema } = mongoose;

const requiredSkillSchema = new Schema({
  skill: { type: String },
  requiredLevel: { type: Number, min: 1, max: 5 },
  currentLevel: { type: Number, min: 0, max: 5 },
  gap: { type: Number },
}, { _id: false });

const skillGapAnalysisSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  targetDesignation: { type: Schema.Types.ObjectId, ref: 'Designation' },
  assessmentDate: { type: Date },
  requiredSkills: [requiredSkillSchema],
  overallGapScore: { type: Number, default: 0 },
  recommendedTrainings: [{ type: Schema.Types.ObjectId, ref: 'TrainingCourse' }],
  status: { type: String, enum: ['draft', 'completed'], default: 'draft' },
  assessedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

skillGapAnalysisSchema.index({ employee: 1, isDeleted: 1 });

module.exports = mongoose.model('SkillGapAnalysis', skillGapAnalysisSchema);
