'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectRoleSchema = new Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  permissions: [{ type: String }],
  isActive:    { type: Boolean, default: true },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

projectRoleSchema.index({ isActive: 1 });

module.exports = mongoose.model('ProjectRole', projectRoleSchema);
