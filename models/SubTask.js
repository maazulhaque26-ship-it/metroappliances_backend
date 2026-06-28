'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const subTaskSchema = new Schema({
  task:          { type: Schema.Types.ObjectId, ref: 'ProjectTask', required: true },
  title:         { type: String, required: true, trim: true },
  status:        { type: String, enum: ['todo','done'], default: 'todo' },
  assignee:      { type: Schema.Types.ObjectId, ref: 'Employee' },
  dueDate:       { type: Date },
  completedDate: { type: Date },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

subTaskSchema.index({ task: 1 });

module.exports = mongoose.model('SubTask', subTaskSchema);
