'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskCommentSchema = new Schema({
  task:      { type: Schema.Types.ObjectId, ref: 'ProjectTask', required: true },
  author:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true },
  isEdited:  { type: Boolean, default: false },
  editedAt:  { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

taskCommentSchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('TaskComment', taskCommentSchema);
