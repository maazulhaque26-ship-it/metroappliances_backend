const mongoose = require('mongoose');
const { Schema } = mongoose;

const developmentAreaSchema = new Schema({
  area: { type: String },
  actions: { type: String },
  timeline: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
}, { _id: false });

const careerDevelopmentPlanSchema = new Schema({
  planNumber: { type: String, unique: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  targetDesignation: { type: Schema.Types.ObjectId, ref: 'Designation' },
  targetDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  timelineYears: { type: Number, default: 2 },
  currentSkills: [{ type: String }],
  targetSkills: [{ type: String }],
  developmentAreas: [developmentAreaSchema],
  mentors: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

careerDevelopmentPlanSchema.pre('validate', async function (next) {
  if (!this.planNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('CareerDevelopmentPlan').countDocuments();
    this.planNumber = `CDP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

careerDevelopmentPlanSchema.index({ employee: 1, isDeleted: 1 });

module.exports = mongoose.model('CareerDevelopmentPlan', careerDevelopmentPlanSchema);
