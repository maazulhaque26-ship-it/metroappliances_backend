'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectPhaseSchema = new Schema({
  project:           { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  name:              { type: String, required: true, trim: true },
  order:             { type: Number, default: 0 },
  status:            { type: String, enum: ['pending','active','completed'], default: 'pending' },
  startDate:         { type: Date },
  endDate:           { type: Date },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  isDeleted:         { type: Boolean, default: false },
}, { timestamps: true });

projectPhaseSchema.index({ project: 1, order: 1 });

module.exports = mongoose.model('ProjectPhase', projectPhaseSchema);
