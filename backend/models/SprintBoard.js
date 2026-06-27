'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const sprintBoardSchema = new Schema({
  project:          { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  name:             { type: String, required: true, trim: true },
  goal:             { type: String },
  startDate:        { type: Date },
  endDate:          { type: Date },
  status:           { type: String, enum: ['planning','active','completed','cancelled'], default: 'planning' },
  capacity:         { type: Number },
  completedPoints:  { type: Number, default: 0 },
  totalPoints:      { type: Number, default: 0 },
  tasks:            [{ type: Schema.Types.ObjectId, ref: 'ProjectTask' }],
  createdBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

sprintBoardSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('SprintBoard', sprintBoardSchema);
