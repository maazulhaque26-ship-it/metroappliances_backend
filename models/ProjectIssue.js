'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectIssueSchema = new Schema({
  issueCode:   { type: String, unique: true },
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  type:        { type: String, enum: ['bug','blocker','question','improvement'], default: 'bug' },
  severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:      { type: String, enum: ['open','in_progress','resolved','closed','wont_fix'], default: 'open' },
  reportedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  assignee:    { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:  { type: Date },
  resolution:  { type: String },
  linkedTask:  { type: Schema.Types.ObjectId, ref: 'ProjectTask' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

projectIssueSchema.index({ project: 1, status: 1 });

projectIssueSchema.pre('validate', async function (next) {
  if (!this.issueCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ProjectIssue').countDocuments();
    this.issueCode = `ISS-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProjectIssue', projectIssueSchema);
