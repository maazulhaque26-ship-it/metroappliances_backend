const mongoose = require('mongoose');
const { Schema } = mongoose;

const successorSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
  readinessLevel: {
    type: String,
    enum: ['ready_now', 'ready_1_2_years', 'ready_3_5_years'],
    default: 'ready_1_2_years',
  },
  developmentNeeds: { type: String },
  strengths: { type: String },
  rank: { type: Number },
}, { _id: false });

const successionPlanSchema = new Schema({
  position: { type: Schema.Types.ObjectId, ref: 'Designation', required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  currentHolder: { type: Schema.Types.ObjectId, ref: 'Employee' },
  criticality: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  successors: [successorSchema],
  planningDate: { type: Date },
  reviewDate: { type: Date },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

successionPlanSchema.index({ position: 1, isDeleted: 1 });

module.exports = mongoose.model('SuccessionPlan', successionPlanSchema);
