'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectMemberSchema = new Schema({
  project:    { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  employee:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  role:       { type: Schema.Types.ObjectId, ref: 'ProjectRole' },
  allocation: { type: Number, default: 100, min: 0, max: 100 },
  joinedAt:   { type: Date, default: Date.now },
  leftAt:     { type: Date },
  isActive:   { type: Boolean, default: true },
  addedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

projectMemberSchema.index({ project: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
