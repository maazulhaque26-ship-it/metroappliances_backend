'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectSchema = new Schema({
  projectCode:       { type: String, unique: true },
  name:              { type: String, required: true, trim: true },
  description:       { type: String },
  status:            { type: String, enum: ['planning','active','on_hold','completed','cancelled'], default: 'planning' },
  priority:          { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  type:              { type: String, enum: ['internal','external','research','maintenance'], default: 'internal' },
  startDate:         { type: Date },
  endDate:           { type: Date },
  actualStartDate:   { type: Date },
  actualEndDate:     { type: Date },
  budget:            { type: Number },
  currency:          { type: String, default: 'INR' },
  projectManager:    { type: Schema.Types.ObjectId, ref: 'User' },
  client:            { type: String },
  department:        { type: Schema.Types.ObjectId, ref: 'Department' },
  template:          { type: Schema.Types.ObjectId, ref: 'ProjectTemplate' },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

projectSchema.index({ status: 1, isDeleted: 1 });
projectSchema.index({ projectManager: 1 });

projectSchema.pre('validate', async function (next) {
  if (!this.projectCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Project').countDocuments();
    this.projectCode = `PRJ-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
