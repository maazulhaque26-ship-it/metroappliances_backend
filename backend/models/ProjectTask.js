'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectTaskSchema = new Schema({
  taskCode:       { type: String, unique: true },
  project:        { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  phase:          { type: Schema.Types.ObjectId, ref: 'ProjectPhase' },
  milestone:      { type: Schema.Types.ObjectId, ref: 'Milestone' },
  parentTask:     { type: Schema.Types.ObjectId, ref: 'ProjectTask' },
  title:          { type: String, required: true, trim: true },
  description:    { type: String },
  type:           { type: String, enum: ['task','bug','feature','improvement'], default: 'task' },
  status:         { type: String, enum: ['todo','in_progress','review','done','cancelled'], default: 'todo' },
  priority:       { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  assignee:       { type: Schema.Types.ObjectId, ref: 'Employee' },
  assignedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  estimatedHours: { type: Number },
  actualHours:    { type: Number, default: 0 },
  progress:       { type: Number, default: 0, min: 0, max: 100 },
  startDate:      { type: Date },
  dueDate:        { type: Date },
  completedDate:  { type: Date },
  tags:           [{ type: String }],
  isDeleted:      { type: Boolean, default: false },
}, { timestamps: true });

projectTaskSchema.index({ project: 1, status: 1 });
projectTaskSchema.index({ assignee: 1, status: 1 });

projectTaskSchema.pre('validate', async function (next) {
  if (!this.taskCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ProjectTask').countDocuments();
    this.taskCode = `TSK-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProjectTask', projectTaskSchema);
