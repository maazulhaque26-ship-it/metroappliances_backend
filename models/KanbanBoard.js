'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const kanbanBoardSchema = new Schema({
  project:   { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  name:      { type: String, required: true, trim: true },
  description: { type: String },
  isDefault:   { type: Boolean, default: false },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

kanbanBoardSchema.index({ project: 1 });

module.exports = mongoose.model('KanbanBoard', kanbanBoardSchema);
