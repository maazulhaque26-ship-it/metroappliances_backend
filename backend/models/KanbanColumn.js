'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const kanbanColumnSchema = new Schema({
  board:      { type: Schema.Types.ObjectId, ref: 'KanbanBoard', required: true },
  name:       { type: String, required: true, trim: true },
  order:      { type: Number, default: 0 },
  color:      { type: String },
  wipLimit:   { type: Number },
  taskStatus: { type: String, enum: ['todo','in_progress','review','done','cancelled'] },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

kanbanColumnSchema.index({ board: 1, order: 1 });

module.exports = mongoose.model('KanbanColumn', kanbanColumnSchema);
