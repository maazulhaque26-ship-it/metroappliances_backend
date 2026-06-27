'use strict';
const mongoose = require('mongoose');

const PMOLessonsLearnedSchema = new mongoose.Schema({
  lessonCode:  { type: String, unique: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category:    { type: String, enum: ['planning', 'execution', 'monitoring', 'closing', 'stakeholder', 'risk', 'communication', 'technology', 'process', 'people', 'other'], default: 'other' },
  type:        { type: String, enum: ['success', 'failure', 'improvement', 'warning'], default: 'improvement' },
  phase:       { type: String, enum: ['initiation', 'planning', 'execution', 'monitoring_control', 'closure', 'post_project'], default: 'execution' },
  portfolio:   { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  program:     { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  situation:   { type: String, default: '' },
  action:      { type: String, default: '' },
  result:      { type: String, default: '' },
  recommendation: { type: String, default: '' },
  impact:      { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  isApproved:  { type: Boolean, default: false },
  tags:        [{ type: String }],
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

PMOLessonsLearnedSchema.pre('validate', async function (next) {
  if (this.lessonCode) return next();
  try {
    const year = new Date().getFullYear();
    const last = await mongoose.model('PMOLessonsLearned').findOne({ lessonCode: new RegExp(`^LL-${year}-`) }).sort({ lessonCode: -1 }).lean();
    const seq = last ? (parseInt(last.lessonCode.split('-')[2], 10) + 1) : 1;
    this.lessonCode = `LL-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.models.PMOLessonsLearned || mongoose.model('PMOLessonsLearned', PMOLessonsLearnedSchema);
