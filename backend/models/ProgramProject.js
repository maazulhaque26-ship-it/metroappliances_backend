'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Maps a Sprint 15A Project into a Program (and thereby a Portfolio).
const programProjectSchema = new Schema({
  program:    { type: Schema.Types.ObjectId, ref: 'Program', required: true },
  portfolio:  { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  project:    { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  alignment:  { type: Number, min: 0, max: 100, default: 0 },
  weight:     { type: Number, min: 0, max: 100, default: 100 },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

programProjectSchema.index({ program: 1, project: 1 }, { unique: true });
programProjectSchema.index({ portfolio: 1 });

module.exports = mongoose.model('ProgramProject', programProjectSchema);
