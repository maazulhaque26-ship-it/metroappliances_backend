'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioRoadmapSchema = new Schema({
  portfolio:   { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  lane:        { type: String, enum: ['strategy','delivery','technology','operations','compliance'], default: 'delivery' },
  type:        { type: String, enum: ['epic','initiative','release','milestone','phase'], default: 'initiative' },
  status:      { type: String, enum: ['planned','in_progress','completed','delayed','cancelled'], default: 'planned' },
  startDate:   { type: Date },
  endDate:     { type: Date },
  program:     { type: Schema.Types.ObjectId, ref: 'Program' },
  order:       { type: Number, default: 0 },
  progress:    { type: Number, min: 0, max: 100, default: 0 },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

portfolioRoadmapSchema.index({ portfolio: 1, startDate: 1 });

module.exports = mongoose.model('PortfolioRoadmap', portfolioRoadmapSchema);
