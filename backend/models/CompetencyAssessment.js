const mongoose = require('mongoose');
const { Schema } = mongoose;

const competencyAssessmentSchema = new Schema({
  cycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  competency: { type: Schema.Types.ObjectId, ref: 'Competency', required: true },
  selfRating: { type: Number, min: 1, max: 5 },
  managerRating: { type: Number, min: 1, max: 5 },
  finalRating: { type: Number, min: 1, max: 5 },
  selfComments: { type: String },
  managerComments: { type: String },
  assessedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

competencyAssessmentSchema.index({ cycle: 1, employee: 1, competency: 1 }, { unique: true });

module.exports = mongoose.model('CompetencyAssessment', competencyAssessmentSchema);
