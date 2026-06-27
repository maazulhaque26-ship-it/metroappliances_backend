'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectNotificationSchema = new Schema({
  project:          { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  recipient:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:             { type: String, enum: ['task_assigned','task_completed','milestone_completed','issue_created','risk_created','project_update','comment_added'], default: 'project_update' },
  message:          { type: String, required: true },
  isRead:           { type: Boolean, default: false },
  relatedTask:      { type: Schema.Types.ObjectId, ref: 'ProjectTask' },
  relatedMilestone: { type: Schema.Types.ObjectId, ref: 'Milestone' },
  isDeleted:        { type: Boolean, default: false },
}, { timestamps: true });

projectNotificationSchema.index({ recipient: 1, isRead: 1 });
projectNotificationSchema.index({ project: 1 });

module.exports = mongoose.model('ProjectNotification', projectNotificationSchema);
