'use strict';
const mongoose = require('mongoose');

const employeeSkillSchema = new mongoose.Schema({
  employee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  skillName:      { type: String, required: true, trim: true },
  skillCategory:  { type: String, enum: ['technical','functional','soft','language','domain','tool'], default: 'technical' },
  proficiency:    { type: String, enum: ['beginner','intermediate','advanced','expert'], default: 'intermediate' },
  yearsExperience:{ type: Number, default: 0 },
  isVerified:     { type: Boolean, default: false },
  lastUsed:       { type: Date },
  notes:          { type: String, default: '' },
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

employeeSkillSchema.index({ employee: 1 });
employeeSkillSchema.index({ skillName: 1 });
employeeSkillSchema.index({ skillCategory: 1 });

module.exports = mongoose.model('EmployeeSkill', employeeSkillSchema);
