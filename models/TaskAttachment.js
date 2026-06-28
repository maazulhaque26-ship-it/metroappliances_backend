'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskAttachmentSchema = new Schema({
  task:         { type: Schema.Types.ObjectId, ref: 'ProjectTask', required: true },
  uploadedBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName:     { type: String, required: true },
  fileUrl:      { type: String, required: true },
  fileSize:     { type: Number },
  mimeType:     { type: String },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

taskAttachmentSchema.index({ task: 1 });

module.exports = mongoose.model('TaskAttachment', taskAttachmentSchema);
