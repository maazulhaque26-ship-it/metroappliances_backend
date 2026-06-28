'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const kanbanCardSchema = new Schema({
  board:       { type: Schema.Types.ObjectId, ref: 'KanbanBoard', required: true },
  column:      { type: Schema.Types.ObjectId, ref: 'KanbanColumn', required: true },
  task:        { type: Schema.Types.ObjectId, ref: 'ProjectTask' },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  order:       { type: Number, default: 0 },
  assignee:    { type: Schema.Types.ObjectId, ref: 'Employee' },
  dueDate:     { type: Date },
  labels:      [{ type: String }],
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

kanbanCardSchema.index({ board: 1, column: 1 });
kanbanCardSchema.index({ column: 1, order: 1 });

module.exports = mongoose.model('KanbanCard', kanbanCardSchema);
